import { ITEMS_TABLE, ItemsSchema, ScheduleSchema } from "../db/Schemas"
import { encodePageToken, decodePageToken } from "../db/PageToken"
import { ScheduleTable } from "../db/ScheduleTable"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"
import { ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"

const DEFAULT_PAGE_SIZE = 25

/**
 * Lists currently-borrowed items that are overdue for a given borrower,
 * paginated. ItemsSchema has no due-date field of its own, so "overdue"
 * is defined here as: borrower matches, and at least one of the item's
 * `schedule` entries (its reservation history/associations) is a
 * ScheduleSchema whose endTime has already passed. Scans ItemsSchema
 * unfiltered (no single-equality FilterExpression covers "borrower is
 * this borrower AND some linked schedule is overdue" in one pass), then
 * filters + cross-references ScheduleTable in-memory per page.
 */
export class ListOverdueItems {
    public static NAME: string = "list overdue items"

    private readonly client: DBClient
    private readonly scheduleTable: ScheduleTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.client = client
        this.scheduleTable = new ScheduleTable(client)
        this.metrics = metrics
    }

    public execute(input: ListOverdueItemsInput): Promise<ListOverdueItemsResult> {
        return emitAPIMetrics(
            () => {
                return this.performAllFVAs(input)
                    .then(() => {
                        const params: ScanCommandInput = {
                            TableName: ITEMS_TABLE,
                            Limit: input.limit ?? DEFAULT_PAGE_SIZE,
                            ...(input.pageToken ? { ExclusiveStartKey: decodePageToken(input.pageToken) } : {})
                        }

                        return this.client.scan(params)
                            .then((output: ScanCommandOutput) => {
                                const borrowedByUser: ItemsSchema[] = ((output.Items ?? []) as ItemsSchema[])
                                    .filter((item: ItemsSchema) => item.borrower === input.borrower)

                                return Promise.all(borrowedByUser.map((item: ItemsSchema) =>
                                    this.isOverdue(item).then((overdue: boolean) => (overdue ? item : undefined))
                                )).then((maybeOverdue: (ItemsSchema | undefined)[]) => ({
                                    items: maybeOverdue.filter((item): item is ItemsSchema => item !== undefined),
                                    nextPageToken: output.LastEvaluatedKey ? encodePageToken(output.LastEvaluatedKey) : undefined
                                }))
                            })
                    })
            },
            ListOverdueItems.NAME, this.metrics
        )
    }

    private isOverdue(item: ItemsSchema): Promise<boolean> {
        const now: number = Date.now()
        return Promise.all(item.schedule.map((scheduleId: string) => this.scheduleTable.get(scheduleId)))
            .then((schedules: ScheduleSchema[]) => schedules.some((schedule) => schedule && schedule.endTime < now))
    }

    private performAllFVAs(input: ListOverdueItemsInput): Promise<void> {
        return new Promise((resolve, reject) => {
            if (input.borrower == undefined) {
                reject(new Error("Missing required field 'borrower'"))
            }
            resolve()
        })
    }
}

export interface ListOverdueItemsInput {
    borrower?: string,
    limit?: number,
    pageToken?: string
}

export interface ListOverdueItemsResult {
    items: ItemsSchema[],
    nextPageToken?: string
}

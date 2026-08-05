import { SCHEDULE_TABLE, ScheduleSchema, ITEMS_TABLE, ItemsSchema } from "./Schemas";
import { DBClient } from "../injection/db/DBClient"
import { DeleteCommandInput, GetCommandInput, GetCommandOutput, PutCommandInput, ScanCommandInput, UpdateCommandInput } from "@aws-sdk/lib-dynamodb"
import { decodePageToken } from "./PageToken"
import { scanUntilLimit } from "./scanUntilLimit"

const DEFAULT_PAGE_SIZE = 25

export class ScheduleTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Adds reservation to Schedule Table
     */
    public create(
        id: string,
        borrower: string,
        itemIds: string[],
        startTime: number,
        endTime: number,
        notes: string,
    ): Promise<string> {
        return this.get(id)
            .then((entry: ScheduleSchema) => {
                if (entry) {
                    throw Error(`Schedule ID ${id} is not unique.`)
                } else {
                    const reservation: ScheduleSchema = {
                        id: id,
                        borrower: borrower,
                        itemIds: itemIds,
                        startTime: startTime,
                        endTime: endTime,
                        notes: notes
                    }

                    const indexParams: PutCommandInput = {
                        TableName: SCHEDULE_TABLE,
                        Item: reservation
                    }

                    if (Array.from(new Set(itemIds)).length !== itemIds.length) {
                        throw Error("Duplicate itemIds were passed in")
                    }

                    return this.validateNoOverlap(itemIds, startTime, endTime)
                    .then(() => this.client.put(indexParams))
                    .then(() => Promise.all((itemIds.map((itemId: string) => {
                        const getItemsParams: GetCommandInput = {
                            TableName: ITEMS_TABLE,
                            Key: {
                                "id": itemId
                            }
                        }
                        return this.client.get(getItemsParams)
                        .then((output: GetCommandOutput) => {
                            const item: ItemsSchema = output.Item as ItemsSchema
                            if (item) {
                                const itemsParams: UpdateCommandInput = {
                                    TableName: ITEMS_TABLE,
                                    Key: {
                                        "id": itemId
                                    },
                                    UpdateExpression: "SET #key = list_append(#key, :val)",
                                    ExpressionAttributeNames: {
                                        "#key": "schedule"
                                    },
                                    ExpressionAttributeValues: {
                                        ":val": [id]
                                    }
                                }
                                return this.client.update(itemsParams)
                            } else {
                                throw Error(`Unable to find itemId ${itemId}`)
                            }
                        })
                        .then(() => itemId)
                    }))))
                    .then(() => id)
                }
            })
    }

    /**
     * Updates an existing reservation's endTime in place, preserving its id
     * and every other field. Reuses the same overlap validation as create()
     * (validateNoOverlap), excluding the reservation being extended itself
     * from that check -- otherwise every extension would trivially conflict
     * with its own pre-extension window, since that window is still present
     * in each item's schedule[] list at validation time.
     */
    public updateEndTime(
        id: string,
        newEndTime: number
    ): Promise<string> {
        return this.get(id)
            .then((entry: ScheduleSchema) => {
                if (!entry) {
                    throw Error(`Schedule ${id} doesn't exist.`)
                }
                if (newEndTime <= entry.startTime) {
                    throw Error(`New end time ${newEndTime} must be after the reservation's start time ${entry.startTime}`)
                }

                return this.validateNoOverlap(entry.itemIds, entry.startTime, newEndTime, id)
                    .then(() => {
                        const updateParams: UpdateCommandInput = {
                            TableName: SCHEDULE_TABLE,
                            Key: {
                                "id": id
                            },
                            UpdateExpression: "SET #key = :val",
                            ExpressionAttributeNames: {
                                "#key": "endTime"
                            },
                            ExpressionAttributeValues: {
                                ":val": newEndTime
                            }
                        }
                        return this.client.update(updateParams)
                    })
                    .then(() => id)
            })
    }

    /**
     * Throws if (startTime, endTime) overlaps any existing reservation on
     * any of itemIds, per validateDate. excludeScheduleId skips a
     * reservation with that id from the check -- used by updateEndTime so
     * extending a reservation doesn't conflict with its own current window.
     */
    private validateNoOverlap(
        itemIds: string[],
        startTime: number,
        endTime: number,
        excludeScheduleId?: string
    ): Promise<void> {
        return Promise.all(itemIds.map((itemId: string): Promise<void[]> => {
            const getItemsParams: GetCommandInput = {
                TableName: ITEMS_TABLE,
                Key: {
                    "id": itemId
                }
            }
            return this.client.get(getItemsParams)
                .then((output: GetCommandOutput): Promise<void[]> => {
                    const item: ItemsSchema = output.Item as ItemsSchema
                    if (item) {
                        return Promise.all(item.schedule
                            .filter((reservationId: string) => reservationId !== excludeScheduleId)
                            .map((reservationId: string): Promise<void> => {
                                return this.get(reservationId)
                                    .then((output: ScheduleSchema) => {
                                        // An id in item.schedule[] can outlive its
                                        // own Schedule row (e.g. the row was
                                        // deleted directly, out-of-band, without
                                        // going through this.delete()'s cleanup of
                                        // this back-reference) -- skip a stale
                                        // reference instead of crashing on
                                        // undefined.startTime below.
                                        if (!output) {
                                            return
                                        }
                                        if (this.validateDate(output.startTime, output.endTime, startTime, endTime)) {
                                            throw Error(`Item ${itemId} is reserved starting ${output.startTime} and ending ${output.endTime}`)
                                        }
                                    })
                            }))
                    } else {
                        throw Error(`Unable to find itemId ${itemId}`)
                    }
                })
        })).then((): void => undefined)
    }

    /**
     * Delete Schedule if it exists. Returns corresponding name of Schedule
     */
    public delete(
        id: string
    ): Promise<string[]> {
        return this.get(id)
            .then((entry: ScheduleSchema) => {
                if (entry) {

                    const scheduleParams: DeleteCommandInput = {
                        TableName: SCHEDULE_TABLE,
                        Key: {
                            "id": id
                        }
                    }

                    return this.client.delete(scheduleParams)
                        .then(() => entry.itemIds.reduce((prev: Promise<any>, itemId: string) => {
                            const getItemsParams: GetCommandInput = {
                                TableName: ITEMS_TABLE,
                                Key: {
                                    "id": itemId
                                }
                            }
                            return prev
                                .then(() => this.client.get(getItemsParams))
                                .then((output: GetCommandOutput) => {
                                    const item: ItemsSchema = output.Item as ItemsSchema
                                    
                                    if (item) {
                                        const updateItemsParams: UpdateCommandInput = {
                                            TableName: ITEMS_TABLE,
                                            Key: {
                                                "id": itemId
                                            },
                                            UpdateExpression: `REMOVE #key[${item.schedule.indexOf(id)}]`,
                                            ExpressionAttributeNames: {
                                                "#key": "schedule"
                                            }
                                        }
                                        return this.client.update(updateItemsParams)
                                    } else {
                                        throw Error(`Unable to find itemId ${itemId}`)
                                    }
                                })
                        }, Promise.resolve()))
                        .then(() => entry.itemIds)
                } else {
                    throw Error(`Schedule ${id} doesn't exist.`)
                }
            })
    }

    /**
     * Get reservation from id
     * returns null if reservation not found.
     */
    public get(
        id: string
    ): Promise<ScheduleSchema> {
        const params: GetCommandInput = {
            TableName: SCHEDULE_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(params)
            .then((output: GetCommandOutput) => {
                if (output) {
                    return output.Item as ScheduleSchema
                } else {
                    return undefined
                }
            })
    }

    /**
     * Lists reservations for a given borrower, paginated.
     *
     * No GSI exists on ScheduleSchema.borrower today, so this is a table
     * Scan with a FilterExpression - acceptable at RMS's current scale
     * since the tables aren't CDK-managed (adding a GSI is a separate,
     * out-of-band change). DynamoDB applies FilterExpression *after*
     * Limit, so a returned page can have fewer (even zero) matching
     * entries despite more data remaining - callers must keep paging
     * using nextPageToken until it's undefined, not stop on a short page.
     */
    public listByBorrower(
        borrower: string,
        limit: number = DEFAULT_PAGE_SIZE,
        pageToken?: string
    ): Promise<ListByBorrowerResult> {
        const params: ScanCommandInput = {
            TableName: SCHEDULE_TABLE,
            Limit: limit,
            FilterExpression: "#borrower = :borrower",
            ExpressionAttributeNames: {
                "#borrower": "borrower"
            },
            ExpressionAttributeValues: {
                ":borrower": borrower
            },
            ...(pageToken ? { ExclusiveStartKey: decodePageToken(pageToken) } : {})
        }

        return scanUntilLimit<ScheduleSchema>(this.client, params, limit)
    }

    /**
     * Validates if the given date ranges conflict
     * @param startDate1 starting date of the first time range. Given in timestamp (number) fomat
     * @param endDate1 end date of the first time range. Given in timestamp (number) fomat
     * @param startDate2 starting date of the second time range. Given in timestamp (number) fomat
     * @param endDate2 end date of the second time range. Given in timestamp (number) fomat
     * @returns Returns true if (startDate1, endDate1) overlaps with the date range of (startDate2, endDate2). Returns false otherwise
     */
         private validateDate(startDate1: number, endDate1:number, startDate2: number, endDate2: number): boolean {
            // convert timestamp numbers to date objects
            const oldStartTime = new Date(startDate1)
            const oldEndTime = new Date(endDate1)
            const newStartTime = new Date(startDate2)
            const newEndTime = new Date(endDate2)
            // Catches a new endpoint falling inside the old range, AND (added
            // for ExtendReservation) the reverse: the new range fully
            // containing the old range, with neither new endpoint inside the
            // old range (e.g. extending a reservation's endTime out past
            // another reservation that started and ended entirely within the
            // extension). Without this second clause, an extension could
            // silently swallow another reservation whole instead of being
            // rejected.
            return (newStartTime >= oldStartTime && newStartTime <= oldEndTime)
                || (newEndTime >= oldStartTime && newEndTime <= oldEndTime)
                || (newStartTime <= oldStartTime && newEndTime >= oldEndTime)
    }
}

export interface ListByBorrowerResult {
    items: ScheduleSchema[],
    nextPageToken?: string
}
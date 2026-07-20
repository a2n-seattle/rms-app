import { TransactionsTable } from "../../db/TransactionsTable"
import { MAIN_TABLE, ITEMS_TABLE, TAGS_TABLE, BATCH_TABLE, HISTORY_TABLE, SCHEDULE_TABLE, TRANSACTIONS_TABLE } from "../../db/Schemas"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../../metrics/MetricsHelper"
import { NativeAttributeValue, ScanCommandInput, ScanCommandOutput } from "@aws-sdk/lib-dynamodb"

/**
 * Scan entire table.
 *
 * WARNING: THIS IS A EXPENSIVE OPERATION
 */
export class PrintTable {
    public static NAME: string = "internal print table"

    private readonly client: DBClient
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.client = client
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, PrintTable.NAME)
                .then(() => "Name of table: (Options: main, items, tags, batch, history, schedule, transactions)")
        } else if (scratch.tableName === undefined) {
            scratch.tableName = request
            return this.transactionsTable.appendToScratch(number, "tableName", request)
                .then(() => this.execute(scratch))
                .then(
                    (output: ScanCommandOutput) => this.processSuccess(output, number),
                    (reason: any) => this.processFailure(reason, number)
                )
        } else if (request === "y") {
            return this.execute(scratch)
                .then(
                    (output: ScanCommandOutput) => this.processSuccess(output, number),
                    (reason: any) => this.processFailure(reason, number)
                )
        } else {
            return this.transactionsTable.delete(number)
                .then(() => "Stopped Scanning Table.")
        }
    }

    private processSuccess(output: ScanCommandOutput, number: string): Promise<string> {
        if (output.LastEvaluatedKey) {
            return this.transactionsTable.appendToScratch(number, "ExclusiveStartKey", output.LastEvaluatedKey)
                .then(() => JSON.stringify(output.Items, null, 1) + "\nCONTINUE?")
        } else {
            return this.transactionsTable.delete(number)
                .then(() => JSON.stringify(output.Items, null, 1) + "\nEND")
        }
    }

    private processFailure(reason: any, number: string) {
        return this.transactionsTable.delete(number)
            .then(() => { throw reason })
    }

    /**
     * Scan Table, returning the DynamoDB ScanOutput.
     *
     * Required params in scratch object:
     * @param tableName Name of target table
     * Optional DynamoDB Scan Parameters:
     * @param Limit The maximum number of items to evaluate (not necessarily the number of matching items). If DynamoDB processes the number of items up to the limit while processing the results, it stops the operation and returns the matching values up to that point, and a key in LastEvaluatedKey to apply in a subsequent operation, so that you can pick up where you left off.
     * @param ExclusiveStartKey The primary key of the first item that this operation will evaluate. Use the value that was returned for LastEvaluatedKey in the previous operation.
     * @param FilterExpression A string that contains conditions that DynamoDB applies after the Scan operation, but before the data is returned to you. Items that do not satisfy the FilterExpression criteria are not returned. A FilterExpression is applied after the items have already been read.
     */
    public execute(scratch: ScratchInterface): Promise<ScanCommandOutput> {
        return emitAPIMetrics(
            () => {
                const params: ScanCommandInput = {
                    TableName: this.getTableName(scratch.tableName),
                    Limit: scratch.Limit,
                    ExclusiveStartKey: scratch.ExclusiveStartKey,
                    FilterExpression: scratch.FilterExpression
                }
                return this.client.scan(params)
            },
            PrintTable.NAME, this.metrics
        )
    }

    private getTableName(tableName: string): string {
        if (tableName === "main") {
            return MAIN_TABLE
        } else if (tableName === "items") {
            return ITEMS_TABLE
        } else if (tableName === "tags") {
            return TAGS_TABLE
        } else if (tableName === "batch") {
            return BATCH_TABLE
        } else if (tableName === "history") {
            return HISTORY_TABLE
        } else if (tableName === "schedule") {
            return SCHEDULE_TABLE
        } else if (tableName === "transactions") {
            return TRANSACTIONS_TABLE
        } else {
            throw Error("Unsupported Table Name: " + tableName)
        }
    }
}

interface ScratchInterface {
    tableName?: string
    Limit?: number
    ExclusiveStartKey?: Record<string, NativeAttributeValue>
    FilterExpression?: string
}
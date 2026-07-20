import { Stack } from "aws-cdk-lib"
import { AttributeType, BillingMode, StreamViewType, Table } from "aws-cdk-lib/aws-dynamodb"
import { RemovalPolicy } from "aws-cdk-lib"

/**
 * Mirrors the 7 DynamoDB tables from amplify/backend/storage/*.
 *
 * Six tables (main, items, tags, batch, history, schedule) share an identical
 * shape: partition key "id" (String), streams enabled (NEW_AND_OLD_IMAGES).
 * transactions is the outlier: partition key "number", no streams.
 *
 * RemovalPolicy.RETAIN on every table is non-negotiable — this is live data.
 */
export interface RmsTables {
    main: Table
    items: Table
    tags: Table
    batch: Table
    history: Table
    schedule: Table
    transactions: Table
}

const UNIFORM_TABLE_NAMES = ["main", "items", "tags", "batch", "history", "schedule"] as const

export function defineTables(stack: Stack, envSuffix: string): RmsTables {
    const uniformTables = Object.fromEntries(
        UNIFORM_TABLE_NAMES.map((name) => [
            name,
            new Table(stack, `${capitalize(name)}Table`, {
                tableName: `${name}-${envSuffix}`,
                partitionKey: { name: "id", type: AttributeType.STRING },
                stream: StreamViewType.NEW_AND_OLD_IMAGES,
                billingMode: BillingMode.PROVISIONED,
                readCapacity: 1,
                writeCapacity: 1,
                removalPolicy: RemovalPolicy.RETAIN,
            }),
        ])
    ) as Record<(typeof UNIFORM_TABLE_NAMES)[number], Table>

    const transactions = new Table(stack, "TransactionsTable", {
        tableName: `transactions-${envSuffix}`,
        partitionKey: { name: "number", type: AttributeType.STRING },
        billingMode: BillingMode.PROVISIONED,
        readCapacity: 1,
        writeCapacity: 1,
        removalPolicy: RemovalPolicy.RETAIN,
    })

    return { ...uniformTables, transactions }
}

function capitalize(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1)
}

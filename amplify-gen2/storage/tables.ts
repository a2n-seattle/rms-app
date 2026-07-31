import { Stack } from "aws-cdk-lib"
import { ITable, Table } from "aws-cdk-lib/aws-dynamodb"

/**
 * References the 7 existing DynamoDB tables (created by Gen 1's Amplify
 * CLI / CloudFormation, already holding live production data) by ARN,
 * rather than declaring them as new CDK-managed `Table` constructs.
 *
 * This is the AWS-documented pattern for connecting a Gen 2 backend to
 * pre-existing DynamoDB tables (see "Connect to external Amazon DynamoDB
 * data sources" in the Amplify docs) — the same pattern AWS's own
 * official Gen 1 -> Gen 2 migration tooling uses for DynamoDB tables
 * specifically. `cdk import`/CloudFormation's IMPORT change-set flow was
 * evaluated and rejected: Amplify Gen 2's `ampx` tooling exposes no
 * `cdk.json`/CDK CLI app and no synth-only escape hatch, so `cdk import`
 * isn't reachable without hand-rolling unofficial scaffolding around it —
 * not an acceptable risk against tables holding live data. Referencing by
 * ARN means CloudFormation never issues Create/Update/Delete against the
 * physical tables: the Gen 2 stack can be safely redeployed or even torn
 * down without any risk to table data. The tradeoff is these tables stay
 * unmanaged by CDK (no drift detection, no declarative schema changes),
 * which matches this project's existing schemaless-DynamoDB approach
 * (see ts-code/src/db/Schemas.ts) — TypeScript interfaces, not CDK/CFN,
 * are already the source of truth for table shape here.
 *
 * Six tables (main, items, tags, batch, history, schedule) share an
 * identical shape: partition key "id" (String), streams enabled
 * (NEW_AND_OLD_IMAGES). transactions is the outlier: partition key
 * "number", no streams. (Both facts are informational only now — the
 * live tables already have this shape; nothing here declares it.)
 */
export interface RmsTables {
    main: ITable
    items: ITable
    tags: ITable
    batch: ITable
    history: ITable
    schedule: ITable
    transactions: ITable
}

const UNIFORM_TABLE_NAMES = ["main", "items", "tags", "batch", "history", "schedule"] as const

export function defineTables(stack: Stack, awsAccountId: string, awsRegion: string, envSuffix: string): RmsTables {
    const tableArn = (name: string) =>
        `arn:aws:dynamodb:${awsRegion}:${awsAccountId}:table/${name}-${envSuffix}`

    const uniformTables = Object.fromEntries(
        UNIFORM_TABLE_NAMES.map((name) => [
            name,
            Table.fromTableArn(stack, `${capitalize(name)}Table`, tableArn(name)),
        ])
    ) as Record<(typeof UNIFORM_TABLE_NAMES)[number], ITable>

    const transactions = Table.fromTableArn(stack, "TransactionsTable", tableArn("transactions"))

    return { ...uniformTables, transactions }
}

function capitalize(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1)
}

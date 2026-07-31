import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

/**
 * "Custom function" CDK construct for CreateBatch. See
 * functions/apiFunction.ts for the shared construct shape.
 *
 * Table grants mirror amplify/backend/backend-config.json's dependsOn list
 * for CreateBatch exactly: main, items, tags, batch, history, schedule.
 */
export function defineCreateBatchFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "create-batch",
        "CreateBatch",
        "handlers/api/CreateBatch.handler",
        tables,
        ["main", "items", "tags", "batch", "history", "schedule"]
    )
}

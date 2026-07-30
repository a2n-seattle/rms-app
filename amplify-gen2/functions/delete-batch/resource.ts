import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

/**
 * "Custom function" CDK construct for DeleteBatch. See
 * functions/apiFunction.ts for the shared construct shape.
 *
 * Table grants mirror amplify/backend/backend-config.json's dependsOn list
 * for DeleteBatch exactly: main, items, tags, batch, history, schedule.
 */
export function defineDeleteBatchFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "delete-batch",
        "DeleteBatch",
        "handlers/api/DeleteBatch.handler",
        tables,
        ["main", "items", "tags", "batch", "history", "schedule"]
    )
}

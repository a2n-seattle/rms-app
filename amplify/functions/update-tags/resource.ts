import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

/**
 * "Custom function" CDK construct for UpdateTags. See
 * functions/apiFunction.ts for the shared construct shape.
 *
 * Table grants mirror amplify/backend/backend-config.json's dependsOn list
 * for UpdateTags exactly: main, items, tags, batch, history, schedule.
 */
export function defineUpdateTagsFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "update-tags",
        "UpdateTags",
        "handlers/api/UpdateTags.handler",
        tables,
        ["main", "items", "tags", "batch", "history", "schedule"]
    )
}

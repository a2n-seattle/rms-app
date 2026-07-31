import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

/**
 * "Custom function" CDK construct for AddItem — the Phase 3 proof-of-concept
 * for the Gen 1 -> Gen 2 rebuild. See functions/apiFunction.ts for the
 * shared construct shape.
 *
 * Table grants mirror amplify/backend/backend-config.json's dependsOn list
 * for AddItem exactly: main, items, tags, batch, history, schedule
 * (transactions excluded — AddItem never touches it in Gen 1 either).
 */
export function defineAddItemFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "add-item",
        "AddItem",
        "handlers/api/AddItem.handler",
        tables,
        ["main", "items", "tags", "batch", "history", "schedule"]
    )
}

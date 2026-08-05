import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

/**
 * "Custom function" CDK construct for DeleteReservation. See
 * functions/apiFunction.ts for the shared construct shape.
 *
 * Table grants mirror amplify/backend/backend-config.json's dependsOn list
 * for DeleteReservation exactly: main, items, tags, batch, history, schedule.
 */
export function defineDeleteReservationFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "delete-reservation",
        "DeleteReservation",
        "handlers/api/DeleteReservation.handler",
        tables,
        ["main", "items", "tags", "batch", "history", "schedule", "user"]
    )
}

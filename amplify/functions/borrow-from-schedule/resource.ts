import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

/**
 * "Custom function" CDK construct for BorrowFromSchedule. See
 * functions/apiFunction.ts for the shared construct shape.
 *
 * Table grants mirror amplify/backend/backend-config.json's dependsOn list
 * for BorrowFromSchedule exactly: main, items, tags, batch, history, schedule.
 */
export function defineBorrowFromScheduleFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "borrow-from-schedule",
        "BorrowFromSchedule",
        "handlers/api/BorrowFromSchedule.handler",
        tables,
        ["main", "items", "tags", "batch", "history", "schedule", "user"]
    )
}

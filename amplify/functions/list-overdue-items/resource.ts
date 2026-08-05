import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineListOverdueItemsFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "list-overdue-items",
        "ListOverdueItems",
        "handlers/api/ListOverdueItems.handler",
        tables,
        ["items", "schedule"]
    )
}

import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineListItemsFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "list-items",
        "ListItems",
        "handlers/api/ListItems.handler",
        tables,
        ["main"]
    )
}

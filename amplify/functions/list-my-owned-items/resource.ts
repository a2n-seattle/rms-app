import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineListMyOwnedItemsFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "list-my-owned-items",
        "ListMyOwnedItems",
        "handlers/api/ListMyOwnedItems.handler",
        tables,
        ["main"]
    )
}

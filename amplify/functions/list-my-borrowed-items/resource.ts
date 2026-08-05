import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineListMyBorrowedItemsFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "list-my-borrowed-items",
        "ListMyBorrowedItems",
        "handlers/api/ListMyBorrowedItems.handler",
        tables,
        ["items"]
    )
}

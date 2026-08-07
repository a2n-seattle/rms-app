import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineUpdateItemFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "update-item",
        "UpdateItem",
        "handlers/api/UpdateItem.handler",
        tables,
        ["main"]
    )
}

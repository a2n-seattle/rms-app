import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineGetItemFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "get-item",
        "GetItem",
        "handlers/api/GetItem.handler",
        tables,
        ["main", "items"]
    )
}

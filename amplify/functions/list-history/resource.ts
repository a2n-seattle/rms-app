import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineListHistoryFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "list-history",
        "ListHistory",
        "handlers/api/ListHistory.handler",
        tables,
        ["history"]
    )
}

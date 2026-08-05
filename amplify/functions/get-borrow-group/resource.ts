import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineGetBorrowGroupFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "get-borrow-group",
        "GetBorrowGroup",
        "handlers/api/GetBorrowGroup.handler",
        tables,
        ["items"]
    )
}

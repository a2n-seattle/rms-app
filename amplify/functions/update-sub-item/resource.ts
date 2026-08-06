import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineUpdateSubItemFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "update-sub-item",
        "UpdateSubItem",
        "handlers/api/UpdateSubItem.handler",
        tables,
        ["items"]
    )
}

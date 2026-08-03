import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineGetBatchFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "get-batch",
        "GetBatch",
        "handlers/api/GetBatch.handler",
        tables,
        ["main", "items", "batch"]
    )
}

import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineListBatchesFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "list-batches",
        "ListBatches",
        "handlers/api/ListBatches.handler",
        tables,
        ["batch"]
    )
}

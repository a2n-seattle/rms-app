import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineSearchItemFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "search-item",
        "SearchItem",
        "handlers/api/SearchItem.handler",
        tables,
        ["main", "tags"]
    )
}

import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { IUserPool } from "aws-cdk-lib/aws-cognito"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

/**
 * `userPool` grants `cognito-idp:ListUsers` (GH-353/GH-358) so GetBatch can
 * resolve `owner`'s ownerId/item `borrower` (Cognito subs) to display names.
 */
export function defineGetBatchFunction(stack: Stack, tables: RmsTables, userPool: IUserPool): Function {
    return defineApiFunction(
        stack,
        "get-batch",
        "GetBatch",
        "handlers/api/GetBatch.handler",
        tables,
        ["main", "items", "batch"],
        userPool
    )
}

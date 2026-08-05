import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { IUserPool } from "aws-cdk-lib/aws-cognito"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

/**
 * `userPool` grants `cognito-idp:ListUsers` (GH-353/GH-358) so GetItem can
 * resolve `main.ownerId`/item `borrower` (Cognito subs) to display names.
 */
export function defineGetItemFunction(stack: Stack, tables: RmsTables, userPool: IUserPool): Function {
    return defineApiFunction(
        stack,
        "get-item",
        "GetItem",
        "handlers/api/GetItem.handler",
        tables,
        ["main", "items"],
        userPool
    )
}

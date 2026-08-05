import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { IUserPool } from "aws-cdk-lib/aws-cognito"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

/**
 * "Custom function" CDK construct for AddItem — the Phase 3 proof-of-concept
 * for the Gen 1 -> Gen 2 rebuild. See functions/apiFunction.ts for the
 * shared construct shape.
 *
 * Table grants: main, items, tags, batch, history, schedule (Gen 1 parity,
 * see amplify/backend/backend-config.json's dependsOn list; transactions
 * excluded — AddItem never touches it in Gen 1 either) plus `user` (GH-353,
 * indexes items by owner once `owner` resolves to a real Cognito user).
 * `userPool` grants `cognito-idp:ListUsers` for that owner resolution.
 */
export function defineAddItemFunction(stack: Stack, tables: RmsTables, userPool: IUserPool): Function {
    return defineApiFunction(
        stack,
        "add-item",
        "AddItem",
        "handlers/api/AddItem.handler",
        tables,
        ["main", "items", "tags", "batch", "history", "schedule", "user"],
        userPool
    )
}

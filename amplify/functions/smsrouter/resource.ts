import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

/**
 * "Custom function" CDK construct for smsrouter. See functions/apiFunction.ts
 * for the shared construct shape — smsrouter's build/ holds the entire
 * compiled ts-code tree (all api/*, all handlers/api/*, plus
 * handlers/router/*), not just one handler, since it's a router that
 * multiplexes every operation, but the Function construct itself is
 * identical in shape to the other 10.
 *
 * Table grants mirror amplify/backend/backend-config.json's dependsOn list
 * for smsrouter exactly: main, items, tags, batch, history, schedule,
 * transactions (the only function that also touches transactions).
 *
 * Deploys with no SNS trigger — the old phone number is lost, so there's
 * nothing to subscribe. Rebuilding SMS routing is separate future work.
 */
export function defineSmsRouterFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "smsrouter",
        "smsrouter",
        "handlers/router/SMSRouter.handler",
        tables,
        ["main", "items", "tags", "batch", "history", "schedule", "transactions"]
    )
}

import * as path from "path"
import { Stack, Duration } from "aws-cdk-lib"
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"

/**
 * "Custom function" CDK construct for smsrouter, following the AddItem
 * proof-of-concept pattern (see functions/add-item/resource.ts). Uses a
 * plain lambda.Function (not NodejsFunction) pointed at
 * backend-build-gen2.js's pre-compiled output — smsrouter's build/ holds
 * the entire compiled ts-code tree (all api/*, all handlers/api/*, plus
 * handlers/router/*), not just one handler, since it's a router that
 * multiplexes every operation.
 *
 * Table grants mirror amplify/backend/backend-config.json's dependsOn list
 * for smsrouter exactly: main, items, tags, batch, history, schedule,
 * transactions (the only function that also touches transactions).
 *
 * Deploys with no SNS trigger — the old phone number is lost, so there's
 * nothing to subscribe. Rebuilding SMS routing is separate future work.
 */
export function defineSmsRouterFunction(stack: Stack, tables: RmsTables): Function {
    const fn = new Function(stack, "SmsRouterFunction", {
        functionName: "smsrouter-alpha",
        runtime: Runtime.NODEJS_22_X,
        handler: "handlers/router/SMSRouter.handler",
        code: Code.fromAsset(path.join(__dirname, "build")),
        timeout: Duration.seconds(25),
        environment: {
            STORAGE_MAIN_NAME: tables.main.tableName,
            STORAGE_ITEMS_NAME: tables.items.tableName,
            STORAGE_TAGS_NAME: tables.tags.tableName,
            STORAGE_BATCH_NAME: tables.batch.tableName,
            STORAGE_HISTORY_NAME: tables.history.tableName,
            STORAGE_SCHEDULE_NAME: tables.schedule.tableName,
            STORAGE_TRANSACTIONS_NAME: tables.transactions.tableName,
        },
    })

    tables.main.grantReadWriteData(fn)
    tables.items.grantReadWriteData(fn)
    tables.tags.grantReadWriteData(fn)
    tables.batch.grantReadWriteData(fn)
    tables.history.grantReadWriteData(fn)
    tables.schedule.grantReadWriteData(fn)
    tables.transactions.grantReadWriteData(fn)

    return fn
}

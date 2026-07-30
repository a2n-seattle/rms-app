import * as path from "path"
import { Stack, Duration } from "aws-cdk-lib"
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"

/**
 * "Custom function" CDK construct for CreateBatch, following the AddItem
 * proof-of-concept pattern (see functions/add-item/resource.ts). Uses a
 * plain lambda.Function (not NodejsFunction) pointed at
 * backend-build-gen2.js's pre-compiled output.
 *
 * Table grants mirror amplify/backend/backend-config.json's dependsOn list
 * for CreateBatch exactly: main, items, tags, batch, history, schedule.
 */
export function defineCreateBatchFunction(stack: Stack, tables: RmsTables): Function {
    const fn = new Function(stack, "CreateBatchFunction", {
        functionName: "CreateBatch-alpha",
        runtime: Runtime.NODEJS_22_X,
        handler: "handlers/api/CreateBatch.handler",
        code: Code.fromAsset(path.join(__dirname, "build")),
        timeout: Duration.seconds(25),
        environment: {
            STORAGE_MAIN_NAME: tables.main.tableName,
            STORAGE_ITEMS_NAME: tables.items.tableName,
            STORAGE_TAGS_NAME: tables.tags.tableName,
            STORAGE_BATCH_NAME: tables.batch.tableName,
            STORAGE_HISTORY_NAME: tables.history.tableName,
            STORAGE_SCHEDULE_NAME: tables.schedule.tableName,
        },
    })

    tables.main.grantReadWriteData(fn)
    tables.items.grantReadWriteData(fn)
    tables.tags.grantReadWriteData(fn)
    tables.batch.grantReadWriteData(fn)
    tables.history.grantReadWriteData(fn)
    tables.schedule.grantReadWriteData(fn)

    return fn
}

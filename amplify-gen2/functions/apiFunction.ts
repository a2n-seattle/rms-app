import * as path from "path"
import { Stack, Duration } from "aws-cdk-lib"
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"
import { Table } from "aws-cdk-lib/aws-dynamodb"
import { RmsTables } from "../storage/tables"

/**
 * Shared "custom function" CDK construct builder for the Gen 1 -> Gen 2
 * rebuild's Lambdas. Every function is a plain lambda.Function (not
 * NodejsFunction) pointed at backend-build-gen2.js's pre-compiled output,
 * since the shared ts-code/ source is compiled once outside CDK, not
 * per-function via esbuild. Table env vars + grants are derived from
 * amplify/backend/backend-config.json's per-function dependsOn list,
 * passed in as `tableNames`.
 */
export function defineApiFunction(
    stack: Stack,
    functionDir: string,
    functionName: string,
    handler: string,
    tables: RmsTables,
    tableNames: (keyof RmsTables)[]
): Function {
    const fn = new Function(stack, `${functionName}Function`, {
        functionName: `${functionName}-alpha`,
        runtime: Runtime.NODEJS_22_X,
        handler,
        code: Code.fromAsset(path.join(__dirname, functionDir, "build")),
        timeout: Duration.seconds(25),
        environment: Object.fromEntries(
            tableNames.map((name) => [
                `STORAGE_${name.toUpperCase()}_NAME`,
                (tables[name] as Table).tableName,
            ])
        ),
    })

    tableNames.forEach((name) => (tables[name] as Table).grantReadWriteData(fn))

    return fn
}

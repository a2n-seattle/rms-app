import * as path from "path"
import { Stack, Duration } from "aws-cdk-lib"
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda"
import { ITable } from "aws-cdk-lib/aws-dynamodb"
import { RmsTables } from "../storage/tables"

/**
 * Every Gen 2 Lambda in this repo (API handlers, the Cognito Pre Sign-up
 * trigger, ...) is a plain lambda.Function (not NodejsFunction) pointed
 * at backend-build-gen2.js's pre-compiled output for its own function
 * directory, since the shared ts-code/ source is compiled once outside
 * CDK, not per-function via esbuild. Shared here so each function's
 * resource.ts only states its own timeout/handler/dependencies.
 */
export function functionCode(functionDir: string): Code {
    return Code.fromAsset(path.join(process.cwd(), "amplify", "functions", functionDir, "build"))
}

/**
 * Shared "custom function" CDK construct builder for the Gen 1 -> Gen 2
 * rebuild's API Lambdas specifically -- adds DynamoDB table env vars +
 * grants, derived from amplify/backend/backend-config.json's per-function
 * dependsOn list, passed in as `tableNames`. Functions with no table
 * dependency (e.g. the Cognito Pre Sign-up trigger) build the Function
 * construct directly using functionCode(...) above instead of this.
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
        code: functionCode(functionDir),
        timeout: Duration.seconds(25),
        environment: Object.fromEntries(
            tableNames.map((name) => [
                `STORAGE_${name.toUpperCase()}_NAME`,
                (tables[name] as ITable).tableName,
            ])
        ),
    })

    tableNames.forEach((name) => (tables[name] as ITable).grantReadWriteData(fn))

    return fn
}

import { Construct } from "constructs"
import { Duration } from "aws-cdk-lib"
import { Function, Runtime } from "aws-cdk-lib/aws-lambda"
import { functionCode } from "../apiFunction"

/**
 * Minimal CDK function construct for the Cognito Pre Sign-up trigger.
 * Unlike apiFunction.ts's defineApiFunction, this needs no DynamoDB table
 * env vars or grants -- it only inspects the incoming Cognito event. Built
 * via defineFunction's provider-callback overload (see auth/resource.ts),
 * so `scope` is supplied by Amplify's construct container at synth time,
 * not a manually-created Stack -- matches defineFunction's
 * `(scope: Construct) => IFunction` signature exactly.
 */
export function definePreSignUpFunction(scope: Construct): Function {
    return new Function(scope, "PreSignUpFunction", {
        functionName: "pre-sign-up-alpha",
        runtime: Runtime.NODEJS_22_X,
        handler: "handlers/auth/PreSignUp.handler",
        code: functionCode("pre-sign-up"),
        timeout: Duration.seconds(10),
    })
}

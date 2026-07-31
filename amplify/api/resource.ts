import { Stack } from "aws-cdk-lib"
import {
    RestApi,
    LambdaIntegration,
    CognitoUserPoolsAuthorizer,
    AuthorizationType,
} from "aws-cdk-lib/aws-apigateway"
import { IUserPool } from "aws-cdk-lib/aws-cognito"
import { Function } from "aws-cdk-lib/aws-lambda"

export interface ApiFunctions {
    addItem: Function
    borrowItem: Function
    borrowFromSchedule: Function
    createBatch: Function
    createReservation: Function
    deleteBatch: Function
    deleteItem: Function
    deleteReservation: Function
    returnItem: Function
    updateTags: Function
}

export function defineApiGateway(stack: Stack, userPool: IUserPool, functions: ApiFunctions): RestApi {
    const api = new RestApi(stack, "RmsApi", {
        restApiName: "rms-api-alpha",
    })

    const authorizer = new CognitoUserPoolsAuthorizer(stack, "RmsApiAuthorizer", {
        cognitoUserPools: [userPool],
    })

    const routes: [string, Function][] = [
        ["add-item", functions.addItem],
        ["borrow-item", functions.borrowItem],
        ["borrow-from-schedule", functions.borrowFromSchedule],
        ["create-batch", functions.createBatch],
        ["create-reservation", functions.createReservation],
        ["delete-batch", functions.deleteBatch],
        ["delete-item", functions.deleteItem],
        ["delete-reservation", functions.deleteReservation],
        ["return-item", functions.returnItem],
        ["update-tags", functions.updateTags],
    ]

    routes.forEach(([path, fn]) => {
        api.root.addResource(path).addMethod("POST", new LambdaIntegration(fn), {
            authorizer,
            authorizationType: AuthorizationType.COGNITO,
        })
    })

    return api
}

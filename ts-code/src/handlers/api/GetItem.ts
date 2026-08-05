import { GetItem } from "../../api/GetItem"
import { CognitoUserDirectoryClient } from "../../injection/cognito/CognitoUserDirectoryClient"
import { apiGatewayHandler } from "./APIHelper"

const userDirectory = process.env.AUTH_USER_POOL_ID
    ? new CognitoUserDirectoryClient(process.env.AUTH_USER_POOL_ID)
    : undefined

export const handler = apiGatewayHandler((dbClient, metricsClient, input) =>
    new GetItem(dbClient, metricsClient, userDirectory).execute(input)
)

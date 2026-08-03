import { UpdateTags, UpdateTagsInput } from "../../api/UpdateTags"
import { apiGatewayHandler } from "./APIHelper"

export const handler = apiGatewayHandler((dbClient, metricsClient, input: UpdateTagsInput) =>
    new UpdateTags(dbClient, metricsClient).execute(input)
)

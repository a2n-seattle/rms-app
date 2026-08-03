import { createServerRunner } from "@aws-amplify/adapter-nextjs"
import outputs from "@/amplify_outputs.json"

export const { runWithAmplifyServerContext, createAuthRouteHandlers } = createServerRunner({ config: outputs })

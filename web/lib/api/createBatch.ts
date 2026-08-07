import { callRmsApi } from "./client"
import { CreateBatchInput } from "./types"

export function createBatch(idToken: string, input: CreateBatchInput): Promise<string> {
    return callRmsApi("create-batch", idToken, input)
}

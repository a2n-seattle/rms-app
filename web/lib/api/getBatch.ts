import { callRmsApi } from "./client"
import { GetBatchInput, GetBatchResult } from "./types"

export function getBatch(idToken: string, input: GetBatchInput): Promise<GetBatchResult> {
    return callRmsApi("get-batch", idToken, input)
}

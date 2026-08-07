import { callRmsApi } from "./client"
import { DeleteBatchInput } from "./types"

export function deleteBatch(idToken: string, input: DeleteBatchInput): Promise<string> {
    return callRmsApi("delete-batch", idToken, input)
}

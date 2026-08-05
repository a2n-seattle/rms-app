import { callRmsApi } from "./client"
import { ListBatchesInput, ListBatchesResult } from "./types"

export function listBatches(idToken: string, input: ListBatchesInput): Promise<ListBatchesResult> {
    return callRmsApi("list-batches", idToken, input)
}

import { callRmsApi } from "./client"
import { ListHistoryInput, ListHistoryResult } from "./types"

export function listHistory(idToken: string, input: ListHistoryInput): Promise<ListHistoryResult> {
    return callRmsApi("list-history", idToken, input)
}

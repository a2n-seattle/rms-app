import { callRmsApi } from "./client"
import { ListOverdueItemsInput, ListOverdueItemsResult } from "./types"

export function listOverdueItems(idToken: string, input: ListOverdueItemsInput): Promise<ListOverdueItemsResult> {
    return callRmsApi("list-overdue-items", idToken, input)
}

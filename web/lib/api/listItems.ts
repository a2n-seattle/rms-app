import { callRmsApi } from "./client"
import { ListItemsInput, ListItemsResult } from "./types"

export function listItems(idToken: string, input: ListItemsInput): Promise<ListItemsResult> {
    return callRmsApi("list-items", idToken, input)
}

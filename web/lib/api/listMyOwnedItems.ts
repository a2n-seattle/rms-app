import { callRmsApi } from "./client"
import { ListMyOwnedItemsInput, ListMyOwnedItemsResult } from "./types"

export function listMyOwnedItems(idToken: string, input: ListMyOwnedItemsInput): Promise<ListMyOwnedItemsResult> {
    return callRmsApi("list-my-owned-items", idToken, input)
}

import { callRmsApi } from "./client"
import { ListMyBorrowedItemsInput, ListMyBorrowedItemsResult } from "./types"

export function listMyBorrowedItems(idToken: string, input: ListMyBorrowedItemsInput): Promise<ListMyBorrowedItemsResult> {
    return callRmsApi("list-my-borrowed-items", idToken, input)
}

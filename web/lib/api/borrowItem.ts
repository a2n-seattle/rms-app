import { callRmsApi } from "./client"
import { BorrowItemInput } from "./types"

export function borrowItem(idToken: string, input: BorrowItemInput): Promise<string> {
    return callRmsApi("borrow-item", idToken, input)
}

import { callRmsApi } from "./client"
import { GetBorrowGroupInput, GetBorrowGroupResult } from "./types"

export function getBorrowGroup(idToken: string, input: GetBorrowGroupInput): Promise<GetBorrowGroupResult> {
    return callRmsApi("get-borrow-group", idToken, input)
}

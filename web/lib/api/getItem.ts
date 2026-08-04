import { callRmsApi } from "./client"
import { GetItemInput, GetItemResult } from "./types"

export function getItem(idToken: string, input: GetItemInput): Promise<GetItemResult> {
    return callRmsApi("get-item", idToken, input)
}

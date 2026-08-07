import { callRmsApi } from "./client"
import { UpdateSubItemInput } from "./types"

export function updateSubItem(idToken: string, input: UpdateSubItemInput): Promise<string> {
    return callRmsApi("update-sub-item", idToken, input)
}

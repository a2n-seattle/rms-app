import { callRmsApi } from "./client"
import { DeleteItemInput } from "./types"

export function deleteItem(idToken: string, input: DeleteItemInput): Promise<string> {
    return callRmsApi("delete-item", idToken, input)
}

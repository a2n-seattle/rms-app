import { callRmsApi } from "./client"
import { UpdateItemInput } from "./types"

export function updateItem(idToken: string, input: UpdateItemInput): Promise<string> {
    return callRmsApi("update-item", idToken, input)
}

import { callRmsApi } from "./client"
import { AddItemInput } from "./types"

export function addItem(idToken: string, input: AddItemInput): Promise<string> {
    return callRmsApi("add-item", idToken, input)
}

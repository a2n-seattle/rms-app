import { callRmsApi } from "./client"
import { ReturnItemInput } from "./types"

export function returnItem(idToken: string, input: ReturnItemInput): Promise<string> {
    return callRmsApi("return-item", idToken, input)
}

import { callRmsApi } from "./client"
import { ExtendReservationInput } from "./types"

export function extendReservation(idToken: string, input: ExtendReservationInput): Promise<string> {
    return callRmsApi("extend-reservation", idToken, input)
}

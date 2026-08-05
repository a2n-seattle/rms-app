import { callRmsApi } from "./client"
import { DeleteReservationInput } from "./types"

export function deleteReservation(idToken: string, input: DeleteReservationInput): Promise<string> {
    return callRmsApi("delete-reservation", idToken, input)
}

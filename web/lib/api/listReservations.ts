import { callRmsApi } from "./client"
import { ListReservationsInput, ListReservationsResult } from "./types"

export function listReservations(idToken: string, input: ListReservationsInput): Promise<ListReservationsResult> {
    return callRmsApi("list-reservations", idToken, input)
}

import { callRmsApi } from "./client"
import { ListUpcomingReservationsInput, ListUpcomingReservationsResult } from "./types"

export function listUpcomingReservations(
    idToken: string,
    input: ListUpcomingReservationsInput
): Promise<ListUpcomingReservationsResult> {
    return callRmsApi("list-upcoming-reservations", idToken, input)
}

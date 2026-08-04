import { callRmsApi } from "./client"
import { CreateReservationInput } from "./types"

export function createReservation(idToken: string, input: CreateReservationInput): Promise<string> {
    return callRmsApi("create-reservation", idToken, input)
}

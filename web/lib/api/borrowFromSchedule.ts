import { callRmsApi } from "./client"
import { BorrowFromScheduleInput } from "./types"

export function borrowFromSchedule(idToken: string, input: BorrowFromScheduleInput): Promise<string> {
    return callRmsApi("borrow-from-schedule", idToken, input)
}

import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineListUpcomingReservationsFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "list-upcoming-reservations",
        "ListUpcomingReservations",
        "handlers/api/ListUpcomingReservations.handler",
        tables,
        ["schedule"]
    )
}

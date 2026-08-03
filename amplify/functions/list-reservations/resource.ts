import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineListReservationsFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "list-reservations",
        "ListReservations",
        "handlers/api/ListReservations.handler",
        tables,
        ["schedule"]
    )
}

import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineExtendReservationFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "extend-reservation",
        "ExtendReservation",
        "handlers/api/ExtendReservation.handler",
        tables,
        ["schedule", "items"]
    )
}

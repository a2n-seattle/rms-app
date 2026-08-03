import { Stack } from "aws-cdk-lib"
import { Function } from "aws-cdk-lib/aws-lambda"
import { RmsTables } from "../../storage/tables"
import { defineApiFunction } from "../apiFunction"

export function defineGetReservationFunction(stack: Stack, tables: RmsTables): Function {
    return defineApiFunction(
        stack,
        "get-reservation",
        "GetReservation",
        "handlers/api/GetReservation.handler",
        tables,
        ["schedule"]
    )
}

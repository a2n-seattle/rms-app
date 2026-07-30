import { defineBackend } from "@aws-amplify/backend"
import { auth } from "./auth/resource"
import { defineTables } from "./storage/tables"
import { defineAddItemFunction } from "./functions/add-item/resource"
import { defineBorrowItemFunction } from "./functions/borrow-item/resource"
import { defineBorrowFromScheduleFunction } from "./functions/borrow-from-schedule/resource"
import { defineCreateBatchFunction } from "./functions/create-batch/resource"
import { defineCreateReservationFunction } from "./functions/create-reservation/resource"
import { defineDeleteBatchFunction } from "./functions/delete-batch/resource"
import { defineDeleteItemFunction } from "./functions/delete-item/resource"
import { defineDeleteReservationFunction } from "./functions/delete-reservation/resource"
import { defineReturnItemFunction } from "./functions/return-item/resource"
import { defineUpdateTagsFunction } from "./functions/update-tags/resource"
import { defineSmsRouterFunction } from "./functions/smsrouter/resource"

/**
 * Phase 4 complete: auth + all 7 storage tables + all 10 functions (9 API
 * handlers + smsrouter), mirroring Gen 1 alpha's full compute layer. Next
 * up per the migration plan: sandbox validation, then the alpha cutover.
 */
const backend = defineBackend({
    auth,
})

const storageStack = backend.createStack("StorageStack")
const tables = defineTables(storageStack, "alpha")

const functionsStack = backend.createStack("FunctionsStack")
defineAddItemFunction(functionsStack, tables)
defineBorrowItemFunction(functionsStack, tables)
defineBorrowFromScheduleFunction(functionsStack, tables)
defineCreateBatchFunction(functionsStack, tables)
defineCreateReservationFunction(functionsStack, tables)
defineDeleteBatchFunction(functionsStack, tables)
defineDeleteItemFunction(functionsStack, tables)
defineDeleteReservationFunction(functionsStack, tables)
defineReturnItemFunction(functionsStack, tables)
defineUpdateTagsFunction(functionsStack, tables)
defineSmsRouterFunction(functionsStack, tables)

import { defineBackend } from "@aws-amplify/backend"
import { auth } from "./auth/resource"
import { defineTables } from "./storage/tables"
import { defineAddItemFunction } from "./functions/add-item/resource"

/**
 * Phase 3 proof-of-concept scope: auth (referenced) + all 7 storage tables
 * + one representative function (AddItem). Once this is validated end-to-
 * end in a sandbox (per the migration plan), the remaining 9 functions
 * follow the same pattern in Phase 4.
 */
const backend = defineBackend({
    auth,
})

const storageStack = backend.createStack("StorageStack")
const tables = defineTables(storageStack, "alpha")

const functionsStack = backend.createStack("FunctionsStack")
defineAddItemFunction(functionsStack, tables)

import { Stack } from "aws-cdk-lib"
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
import { defineGetItemFunction } from "./functions/get-item/resource"
import { defineSearchItemFunction } from "./functions/search-item/resource"
import { defineGetReservationFunction } from "./functions/get-reservation/resource"
import { defineGetBatchFunction } from "./functions/get-batch/resource"
import { defineListItemsFunction } from "./functions/list-items/resource"
import { defineListReservationsFunction } from "./functions/list-reservations/resource"
import { defineListMyOwnedItemsFunction } from "./functions/list-my-owned-items/resource"
import { defineListMyBorrowedItemsFunction } from "./functions/list-my-borrowed-items/resource"
import { defineListUpcomingReservationsFunction } from "./functions/list-upcoming-reservations/resource"
import { defineListOverdueItemsFunction } from "./functions/list-overdue-items/resource"
import { defineListHistoryFunction } from "./functions/list-history/resource"
import { defineListBatchesFunction } from "./functions/list-batches/resource"
import { defineGetBorrowGroupFunction } from "./functions/get-borrow-group/resource"
import { defineExtendReservationFunction } from "./functions/extend-reservation/resource"
import { defineApiGateway } from "./api/resource"

/**
 * Phase 4 complete: auth + all 7 storage tables + all 10 functions (9 API
 * handlers + smsrouter), mirroring Gen 1 alpha's full compute layer.
 * Phase 5 (alpha cutover): storage tables reference the existing Gen
 * 1-created live tables by ARN (see storage/tables.ts) rather than
 * declaring new CDK-managed ones, since cdk import isn't reachable
 * through ampx's tooling and AWS's own Gen 2 migration guidance keeps
 * DynamoDB tables external to the Gen 2 stack for exactly that reason.
 */
const backend = defineBackend({
    auth,
})

const storageStack = backend.createStack("StorageStack")
const tables = defineTables(
    storageStack,
    Stack.of(storageStack).account,
    Stack.of(storageStack).region,
    "alpha"
)

const functionsStack = backend.createStack("FunctionsStack")
const addItemFn = defineAddItemFunction(functionsStack, tables)
const borrowItemFn = defineBorrowItemFunction(functionsStack, tables)
const borrowFromScheduleFn = defineBorrowFromScheduleFunction(functionsStack, tables)
const createBatchFn = defineCreateBatchFunction(functionsStack, tables)
const createReservationFn = defineCreateReservationFunction(functionsStack, tables)
const deleteBatchFn = defineDeleteBatchFunction(functionsStack, tables)
const deleteItemFn = defineDeleteItemFunction(functionsStack, tables)
const deleteReservationFn = defineDeleteReservationFunction(functionsStack, tables)
const returnItemFn = defineReturnItemFunction(functionsStack, tables)
const updateTagsFn = defineUpdateTagsFunction(functionsStack, tables)
const getItemFn = defineGetItemFunction(functionsStack, tables)
const searchItemFn = defineSearchItemFunction(functionsStack, tables)
const getReservationFn = defineGetReservationFunction(functionsStack, tables)
const getBatchFn = defineGetBatchFunction(functionsStack, tables)
const listItemsFn = defineListItemsFunction(functionsStack, tables)
const listReservationsFn = defineListReservationsFunction(functionsStack, tables)
const listMyOwnedItemsFn = defineListMyOwnedItemsFunction(functionsStack, tables)
const listMyBorrowedItemsFn = defineListMyBorrowedItemsFunction(functionsStack, tables)
const listUpcomingReservationsFn = defineListUpcomingReservationsFunction(functionsStack, tables)
const listOverdueItemsFn = defineListOverdueItemsFunction(functionsStack, tables)
const listHistoryFn = defineListHistoryFunction(functionsStack, tables)
const listBatchesFn = defineListBatchesFunction(functionsStack, tables)
const getBorrowGroupFn = defineGetBorrowGroupFunction(functionsStack, tables)
const extendReservationFn = defineExtendReservationFunction(functionsStack, tables)
defineSmsRouterFunction(functionsStack, tables)

const apiStack = backend.createStack("ApiStack")
const api = defineApiGateway(apiStack, backend.auth.resources.userPool, {
    addItem: addItemFn,
    borrowItem: borrowItemFn,
    borrowFromSchedule: borrowFromScheduleFn,
    createBatch: createBatchFn,
    createReservation: createReservationFn,
    deleteBatch: deleteBatchFn,
    deleteItem: deleteItemFn,
    deleteReservation: deleteReservationFn,
    returnItem: returnItemFn,
    updateTags: updateTagsFn,
    getItem: getItemFn,
    searchItem: searchItemFn,
    getReservation: getReservationFn,
    getBatch: getBatchFn,
    listItems: listItemsFn,
    listReservations: listReservationsFn,
    listMyOwnedItems: listMyOwnedItemsFn,
    listMyBorrowedItems: listMyBorrowedItemsFn,
    listUpcomingReservations: listUpcomingReservationsFn,
    listOverdueItems: listOverdueItemsFn,
    listHistory: listHistoryFn,
    listBatches: listBatchesFn,
    getBorrowGroup: getBorrowGroupFn,
    extendReservation: extendReservationFn,
})

// `ampx generate outputs` only surfaces values added via backend.addOutput
// (landing under amplify_outputs.json's `custom` key) - a plain CDK
// CfnOutput (see api/resource.ts) isn't picked up by it. The web/
// frontend (GH-306) needs this to discover the API Gateway endpoint.
backend.addOutput({
    custom: {
        apiUrl: api.url,
    },
})

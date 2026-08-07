// Hand-mirrored from ts-code/src/api/*.ts input interfaces, kept in sync
// manually rather than importing across the repo root -- keeps web/ a
// clean, independently buildable package for Amplify Hosting's monorepo
// appRoot.

export interface GetItemInput {
    key?: string
}

export interface MainSchema {
    id: string
    nameKey: string
    name: string
    description: string
    owner: string
    ownerId?: string
    location: string
    batch: string[]
    tags: string[]
    items: string[]
    type?: "item" | "room"
}

export interface ItemsSchema {
    id: string
    familyId: string
    name: string
    borrower: string
    borrowTime: number
    returnTime: number
    history: string[]
    schedule: string[]
    notes: string
    borrowGroupId?: string
}

export interface GetItemResult {
    main: MainSchema
    items: ItemsSchema[]
    ownerDisplayName?: string
    borrowerDisplayNames?: (string | undefined)[]
}

export interface ListItemsInput {
    limit?: number
    pageToken?: string
}

export interface ListItemsResult {
    items: MainSchema[]
    nextPageToken?: string
}

export interface SearchItemInput {
    tags?: string[]
}

export interface BorrowItemInput {
    ids?: string[]
    borrower?: string
    notes?: string
}

export interface ReturnItemInput {
    ids?: string[]
    borrower?: string
    notes?: string
    conditions?: { [itemId: string]: string }
}

export interface ScheduleSchema {
    id: string
    borrower: string
    itemIds: string[]
    startTime: number
    endTime: number
    notes?: string
}

export interface ListReservationsInput {
    borrower?: string
    limit?: number
    pageToken?: string
}

export interface ListReservationsResult {
    items: ScheduleSchema[]
    nextPageToken?: string
}

export interface CreateReservationInput {
    borrower?: string
    ids?: string[]
    startTime?: number
    endTime?: number
    notes?: string
}

export interface BorrowFromScheduleInput {
    scheduleId?: string
    notes?: string
}

export interface DeleteReservationInput {
    id?: string
}

export interface ListMyOwnedItemsInput {
    ownerId?: string
    limit?: number
    pageToken?: string
}

export interface ListMyOwnedItemsResult {
    items: MainSchema[]
    nextPageToken?: string
}

export interface ListMyBorrowedItemsInput {
    borrower?: string
    limit?: number
    pageToken?: string
}

export interface ListMyBorrowedItemsResult {
    items: ItemsSchema[]
    nextPageToken?: string
}

export interface ListUpcomingReservationsInput {
    borrower?: string
    limit?: number
    pageToken?: string
}

export interface ListUpcomingReservationsResult {
    items: ScheduleSchema[]
    nextPageToken?: string
}

export interface ListOverdueItemsInput {
    borrower?: string
    limit?: number
    pageToken?: string
}

export interface ListOverdueItemsResult {
    items: ItemsSchema[]
    nextPageToken?: string
}

export interface HistorySchema {
    id: string
    name: string
    itemId: string
    borrower: string
    action: "borrow" | "return"
    notes: string
    timestamp: number
    condition?: string
}

export interface ListHistoryInput {
    borrower?: string
    limit?: number
    pageToken?: string
}

export interface ListHistoryResult {
    items: HistorySchema[]
    nextPageToken?: string
}

export interface BatchSchema {
    id: string
    nameKey: string
    name: string
    val: string[]
    groups: string[]
}

export interface ListBatchesInput {
    limit?: number
    pageToken?: string
}

export interface ListBatchesResult {
    items: BatchSchema[]
    nextPageToken?: string
}

export interface GetBatchInput {
    name?: string
}

export interface CreateBatchInput {
    name?: string
    ids?: string[]
    groups?: string[]
}

export interface DeleteBatchInput {
    name?: string
}

export interface GetBatchDetailedEntry {
    id: string
    name: string
    owner: string
    borrower: string
}

export type GetBatchResult = GetBatchDetailedEntry[]

export interface GetBorrowGroupInput {
    borrowGroupId?: string
}

export interface GetBorrowGroupResult {
    items: ItemsSchema[]
}

export interface ExtendReservationInput {
    id?: string
    newEndTime?: number
}

export interface AddItemInput {
    name?: string
    description?: string
    tags?: string[]
    owner?: string
    location?: string
    friendlyName?: string
    notes?: string
    type?: "item" | "room"
}

export interface DeleteItemInput {
    id?: string
}

export interface UpdateItemInput {
    id?: string
    name?: string
    description?: string
    location?: string
}

export interface UpdateSubItemInput {
    id?: string
    name?: string
    notes?: string
}

// Hand-mirrored from ts-code/src/api/*.ts input interfaces, kept in sync
// manually rather than importing across the repo root -- keeps web/ a
// clean, independently buildable package for Amplify Hosting's monorepo
// appRoot.

export interface GetItemInput {
    key?: string
}

export interface MainSchema {
    id: string
    displayName: string
    description: string
    owner: string
    location: string
    batch: string[]
    tags: string[]
    items: string[]
}

export interface ItemsSchema {
    id: string
    name: string
    friendlyName: string
    borrower: string
    borrowTime: number
    returnTime: number
    history: string[]
    schedule: string[]
    notes: string
}

export interface GetItemResult {
    main: MainSchema
    items: ItemsSchema[]
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
    owner?: string
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

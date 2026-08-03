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

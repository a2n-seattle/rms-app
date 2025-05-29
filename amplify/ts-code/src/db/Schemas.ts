/**
 * @param id Name of item type. This needs to be unique.
 * @param description Optional description of item.
 * @param tags Tags to categorize item.
 * @param items List of IDs of all items of this item type.
 * @param id ID of item. User specified.
 */
export const MAIN_TABLE: string = process.env.STORAGE_MAIN_NAME
export interface MainSchema {
    id: string,
    displayName: string,
    description: string,
    tags: string[],
    items: string[]
}

/**
 * @param owner Name of the owner of the item or where the item is stored.
 * @param notes Notes specific to this item.
 * @param borrower Current borrower of item. Blank if available. Initialized as blank.
 * @param history List of entries in the history table
 * @param schedule List of entries in the schedule table [TODO: Implement Schedule]
 * @param batch List of batches this item is part of.
 */
export const ITEMS_TABLE: string = process.env.STORAGE_ITEMS_NAME
export interface ItemsSchema {
    id: string,
    name: string,
    owner: string,
    borrower: string,
    batch: string[],
    history: string[],
    schedule: string[],
    notes: string
}

export const TAGS_TABLE: string = process.env.STORAGE_TAGS_NAME
export interface TagsSchema {
    id: string,
    val: string[]
}

export const BATCH_TABLE: string = process.env.STORAGE_BATCH_NAME
export interface BatchSchema {
    id: string,
    val: string[],
    groups: string[]
}

/**
 * @param id Random Time Related Unique Key, where the first part of the key is the creation time.
 * @param name Name of Item
 * @param id ID of Item
 * @param borrower Name of Borrower
 * @param action Either borrow or return the specified.
 * @param notes Optional notes about this action.
 * @param timestamp Time when item was created (in epoch milliseconds)
 */
export const HISTORY_TABLE: string = process.env.STORAGE_HISTORY_NAME
export interface HistorySchema {
    id: string,
    name: string,
    itemId: string,
    borrower: string,
    action: "borrow" | "return",
    notes: string,
    timestamp: number
}

/**
 * @param id Random Time Related Unique Key, where the first part of the key is the creation time.
 * @param borrower Email of person reserving the Item.
 * @param itemIds List of item IDs.
 * @param startTime Time reservation starts.
 * @param endTime Time reservation end.
 * @param notes Optional notes about this action.
 */
export const SCHEDULE_TABLE: string = process.env.STORAGE_SCHEDULE_NAME
export interface ScheduleSchema {
    id: string,
    borrower: string,
    itemIds: string[],
    startTime: string,
    endTime: string,
    notes?: string
}

/**
 * @param number Phone Number being used for response.
 * @param type Type of transaction being performed
 * @param scratch Scratch space used by transactions. Initialized as empty.
 */
export const TRANSACTIONS_TABLE: string = process.env.STORAGE_TRANSACTIONS_NAME
export interface TransactionsSchema {
    number: string,
    type: string,
    scratch: any
}
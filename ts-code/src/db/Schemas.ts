/**
 * @param id Random UUID, independent of `name`. Stable even if `name` is edited later.
 * @param nameKey Lowercased `name`, used as an exact-match Scan filter target for
 *   `MainTable.getByName`/`getByNameConsistent` (no GSI is available -- see storage/tables.ts --
 *   so name-based lookup goes through a Scan rather than a direct Get).
 * @param name Human-readable display name of this item family.
 * @param description Optional description of item.
 * @param owner Name of the owner of this item type, or where it's stored (free text -- may not
 *   resolve to a real Cognito user, e.g. a room name or "the church").
 * @param ownerId Cognito `sub` of the owner, when `owner` was resolved against the user pool at
 *   creation time. Absent when `owner` didn't match a real user (rooms, "the church", etc).
 * @param location Location where this item type is stored.
 * @param batch List of batch names this item type is part of.
 * @param tags Tags to categorize item.
 * @param items List of IDs of all items of this item type.
 * @param type Whether this resource is a borrowable "item" or a
 *   reservable-only "room" (rooms are never borrowed/returned or flagged
 *   overdue). Optional and treated as "item" when absent -- existing rows
 *   predate this field, and there's no CDK-managed schema to backfill
 *   (see storage/tables.ts), so every read site must fall back rather than
 *   assume this is always set.
 */
export const MAIN_TABLE: string = process.env.STORAGE_MAIN_NAME
export interface MainSchema {
    id: string,
    nameKey: string,
    name: string,
    description: string,
    owner: string,
    ownerId?: string,
    location: string,
    batch: string[],
    tags: string[],
    items: string[],
    type?: "item" | "room"
}

/**
 * @param id Random UUID, independent of `familyId`/`name`.
 * @param familyId FK into MainTable -- the id of the item family this instance belongs to.
 * @param name Human-readable label for this specific item instance. Defaults to the
 *   generated item id when not provided.
 * @param notes Notes specific to this item.
 * @param borrower Current borrower of item -- Cognito `sub`. Blank if available. Initialized as blank.
 * @param borrowTime Time item was last borrowed (epoch milliseconds). 0 if never borrowed.
 * @param returnTime Time item was last returned (epoch milliseconds). 0 while currently borrowed.
 * @param history List of entries in the history table
 * @param schedule List of entries in the schedule table [TODO: Implement Schedule]
 * @param borrowGroupId The schedule id BorrowFromSchedule consumed to borrow this item, if
 *   currently borrowed via that path (set on borrow, cleared on return). Lets the batched
 *   return flow look up "everything borrowed together" without reconstructing it from the
 *   append-only history log. Optional since items borrowed via the older direct BorrowItem
 *   path (no reservation involved) never get one.
 */
export const ITEMS_TABLE: string = process.env.STORAGE_ITEMS_NAME
export interface ItemsSchema {
    id: string,
    familyId: string,
    name: string,
    borrower: string,
    borrowTime: number,
    returnTime: number,
    history: string[],
    schedule: string[],
    notes: string,
    borrowGroupId?: string
}

/**
 * @param id The tag's own string value -- an intentional natural key, tags are deduplicated
 *   and looked up directly by their string content.
 * @param val List of MainTable ids tagged with this value.
 */
export const TAGS_TABLE: string = process.env.STORAGE_TAGS_NAME
export interface TagsSchema {
    id: string,
    val: string[]
}

/**
 * @param id Random UUID, independent of `name`.
 * @param nameKey Lowercased `name`, exact-match Scan filter target (see MainSchema.nameKey).
 * @param name Human-readable batch name.
 * @param val List of item ids in this batch.
 * @param groups List of group labels for this batch.
 */
export const BATCH_TABLE: string = process.env.STORAGE_BATCH_NAME
export interface BatchSchema {
    id: string,
    nameKey: string,
    name: string,
    val: string[],
    groups: string[]
}

/**
 * @param id Cognito `sub` of the user.
 * @param owned MainTable ids owned by this user (only populated when `MainSchema.owner`
 *   resolved to this user's Cognito account at item-creation time).
 * @param reserved ScheduleTable ids currently reserved by this user.
 * @param borrowed ItemsTable ids currently borrowed by this user.
 * @param history HistoryTable ids of every borrow/return entry ever recorded for this user.
 *   Append-only (never removed) -- unlike owned/reserved/borrowed, this is an audit log, not
 *   a "currently" index.
 */
export const USER_TABLE: string = process.env.STORAGE_USER_NAME
export interface UserSchema {
    id: string,
    owned: string[],
    reserved: string[],
    borrowed: string[],
    history: string[]
}

/**
 * @param id Random Time Related Unique Key, where the first part of the key is the creation time.
 * @param name Name of Item
 * @param id ID of Item
 * @param borrower Name of Borrower
 * @param action Either borrow or return the specified.
 * @param notes Optional notes about this action.
 * @param timestamp Time when item was created (in epoch milliseconds)
 * @param condition Optional condition notes recorded on a "return" action (e.g. "cracked
 *   screen", "missing a leg") -- surfaced in the History tab so damage is visible after the
 *   fact. Never set on "borrow" entries.
 */
export const HISTORY_TABLE: string = process.env.STORAGE_HISTORY_NAME
export interface HistorySchema {
    id: string,
    name: string,
    itemId: string,
    borrower: string,
    action: "borrow" | "return",
    notes: string,
    timestamp: number,
    condition?: string
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
    startTime: number,
    endTime: number,
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
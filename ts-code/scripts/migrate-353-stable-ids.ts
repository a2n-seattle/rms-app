/**
 * One-off migration for GH-353: rewrites live `alpha` DynamoDB data from the
 * old scheme (MainSchema/BatchSchema id === name.toLowerCase(), ItemsSchema.name
 * holding that lowercased name as an FK) to the new scheme (random UUID ids,
 * ItemsSchema.familyId as the FK, TagsSchema.val holding main ids).
 *
 * NOT part of the Lambda build, NOT wired into CI -- run manually once,
 * against `alpha`, right after this PR's backend-cd.yml deploy completes:
 *
 *   AWS_PROFILE=rms-alpha npx ts-node ts-code/scripts/migrate-353-stable-ids.ts
 *
 * Safe to re-run: already-migrated main/batch rows (UUID-shaped id, nameKey
 * present) are skipped.
 *
 * Scope note: does NOT attempt to backfill `MainSchema.ownerId` or resolve
 * existing `borrower`/`owner` values against Cognito -- those stay as their
 * current free-text/email values (still fully functional as display
 * fallbacks) until a new item is created or borrowed through the updated
 * code path. Backfilling identity resolution for pre-existing rows is a
 * separate, lower-urgency follow-up, not required for this migration's
 * actual purpose (fixing id stability for routing).
 */
import { randomUUID } from "crypto"
import {
    DynamoDBClient,
} from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand, UpdateCommand,
} from "@aws-sdk/lib-dynamodb"

const REGION = "us-west-2"
const MAIN_TABLE = "main-alpha"
const ITEMS_TABLE = "items-alpha"
const BATCH_TABLE = "batch-alpha"
const TAGS_TABLE = "tags-alpha"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

// These tables are provisioned at 1 RCU/1 WCU (see resources/seeds' live main-alpha config) --
// a burst of back-to-back writes throttles almost immediately, so pace every write.
const WRITE_DELAY_MS = 1100

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function paced<T>(fn: () => Promise<T>): Promise<T> {
    await sleep(WRITE_DELAY_MS)
    return fn()
}

async function scanAll(tableName: string): Promise<Record<string, any>[]> {
    const items: Record<string, any>[] = []
    let ExclusiveStartKey: Record<string, any> | undefined
    do {
        const output = await client.send(new ScanCommand({ TableName: tableName, ExclusiveStartKey }))
        items.push(...(output.Items ?? []))
        ExclusiveStartKey = output.LastEvaluatedKey
    } while (ExclusiveStartKey)
    return items
}

async function migrateMain(): Promise<Map<string, string>> {
    const rows = await scanAll(MAIN_TABLE)
    const oldToNew = new Map<string, string>()

    for (const row of rows) {
        if (UUID_RE.test(row.id) && row.nameKey) {
            // Already migrated in a prior (possibly interrupted) run -- map by the
            // preserved old name (nameKey), not by the row's current (new) id, so
            // migrateItems/migrateTags's lookups by old name still resolve.
            oldToNew.set(row.nameKey, row.id)
            continue
        }

        const newId = randomUUID()
        oldToNew.set(row.id, newId)

        const { displayName, ...rest } = row
        const newRow = {
            ...rest,
            id: newId,
            nameKey: row.id, // old id was already name.toLowerCase()
            name: displayName ?? row.name,
        }

        await paced(() => client.send(new PutCommand({ TableName: MAIN_TABLE, Item: newRow })))
        await paced(() => client.send(new DeleteCommand({ TableName: MAIN_TABLE, Key: { id: row.id } })))
        console.log(`main: ${row.id} -> ${newId}`)
    }

    return oldToNew
}

async function migrateItems(mainOldToNew: Map<string, string>): Promise<void> {
    const rows = await scanAll(ITEMS_TABLE)

    for (const row of rows) {
        if (row.familyId) {
            // Already migrated.
            continue
        }

        const oldFamilyKey: string = row.name // old FK, a lowercased main name
        const familyId = mainOldToNew.get(oldFamilyKey)
        if (!familyId) {
            console.warn(`item ${row.id}: no main entry found for old FK '${oldFamilyKey}', skipping`)
            continue
        }

        await paced(() => client.send(new UpdateCommand({
            TableName: ITEMS_TABLE,
            Key: { id: row.id },
            UpdateExpression: "SET familyId = :familyId, #name = :name REMOVE friendlyName",
            ExpressionAttributeNames: { "#name": "name" },
            ExpressionAttributeValues: {
                ":familyId": familyId,
                ":name": row.friendlyName ?? row.id,
            },
        })))
        console.log(`item ${row.id}: familyId=${familyId}`)
    }
}

async function migrateTags(mainOldToNew: Map<string, string>): Promise<void> {
    const rows = await scanAll(TAGS_TABLE)

    for (const row of rows) {
        const val: string[] = row.val ?? []
        const newVal = val.map((v) => mainOldToNew.get(v) ?? v)
        if (JSON.stringify(newVal) === JSON.stringify(val) && val.every((v) => UUID_RE.test(v))) {
            continue
        }

        await paced(() => client.send(new UpdateCommand({
            TableName: TAGS_TABLE,
            Key: { id: row.id },
            UpdateExpression: "SET val = :val",
            ExpressionAttributeValues: { ":val": newVal },
        })))
        console.log(`tag ${row.id}: val -> ${JSON.stringify(newVal)}`)
    }
}

async function migrateBatch(): Promise<void> {
    const rows = await scanAll(BATCH_TABLE)

    for (const row of rows) {
        if (UUID_RE.test(row.id) && row.nameKey) {
            continue
        }

        const newId = randomUUID()
        const newRow = { ...row, id: newId, nameKey: row.id, name: row.id }

        await paced(() => client.send(new PutCommand({ TableName: BATCH_TABLE, Item: newRow })))
        await paced(() => client.send(new DeleteCommand({ TableName: BATCH_TABLE, Key: { id: row.id } })))
        console.log(`batch: ${row.id} -> ${newId}`)
    }
}

async function main(): Promise<void> {
    const mainOldToNew = await migrateMain()
    await migrateItems(mainOldToNew)
    await migrateTags(mainOldToNew)
    await migrateBatch()
    console.log("Migration complete.")
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})

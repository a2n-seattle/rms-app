import { getSession } from "@/lib/session"
import { listBatches } from "@/lib/api/listBatches"
import { createBatch } from "@/lib/api/createBatch"
import { revalidatePath } from "next/cache"
import { ActionState, runAction } from "@/lib/actionState"
import { Card } from "@/components/ui/Card"
import { Table } from "@/components/ui/Table"
import { CreateBatchButton } from "./CreateBatchButton"
import styles from "./batches.module.css"

export default async function BatchesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>
}) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { page } = await searchParams
    const { items, nextPageToken } = await listBatches(session.idToken, { pageToken: page })

    async function createBatchAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const name = formData.get("name") as string
            const idsRaw = formData.get("ids") as string
            const groupsRaw = formData.get("groups") as string
            const ids = idsRaw.split(/[\s,]+/).filter((s) => s.length > 0)
            const groups = groupsRaw.split(/[\s,]+/).filter((s) => s.length > 0)

            await createBatch(session.idToken, { name, ids, groups: groups.length > 0 ? groups : undefined })
            revalidatePath("/batches")
        })
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>Batches</h1>
                <CreateBatchButton createBatchAction={createBatchAction} />
            </div>
            {items.length === 0 ? (
                <p className={styles.empty}>No batches yet.</p>
            ) : (
                <Card>
                    <Table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th># Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((batch) => (
                                <tr key={batch.id}>
                                    <td>
                                        <a href={`/batches/${encodeURIComponent(batch.name)}`} className={styles.batchLink}>
                                            {batch.name}
                                        </a>
                                    </td>
                                    <td>{batch.val.length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card>
            )}
            {nextPageToken && (
                <div className={styles.footer}>
                    <a href={`/batches?page=${encodeURIComponent(nextPageToken)}`} className={styles.loadMore}>
                        Load more
                    </a>
                </div>
            )}
        </div>
    )
}

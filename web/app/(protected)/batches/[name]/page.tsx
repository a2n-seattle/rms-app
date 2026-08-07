import { getSession } from "@/lib/session"
import { getBatch } from "@/lib/api/getBatch"
import { deleteBatch } from "@/lib/api/deleteBatch"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { ActionState, runAction } from "@/lib/actionState"
import { Card } from "@/components/ui/Card"
import { Table } from "@/components/ui/Table"
import { DeleteBatchButton } from "./DeleteBatchButton"
import styles from "./batch-detail.module.css"

export default async function BatchDetailPage({ params }: { params: Promise<{ name: string }> }) {
    const session = await getSession()
    if (!session) {
        return null
    }

    const { name } = await params
    const entries = await getBatch(session.idToken, { name })

    async function deleteBatchAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
        "use server"
        return runAction(async () => {
            const session = await getSession()
            if (!session) {
                return
            }
            const batchName = formData.get("name") as string
            await deleteBatch(session.idToken, { name: batchName })
            revalidatePath("/batches")
            redirect("/batches")
        })
    }

    return (
        <div>
            <div className={styles.header}>
                <h1 className={styles.title}>{name}</h1>
                <DeleteBatchButton name={name} deleteBatchAction={deleteBatchAction} />
            </div>
            <Card>
                <Table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Resource</th>
                            <th>Owner</th>
                            <th>Borrower</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry) => (
                            <tr key={entry.id}>
                                <td>
                                    <a href={`/items/${encodeURIComponent(entry.id)}/${encodeURIComponent(entry.id)}`} className={styles.itemLink}>
                                        {entry.id}
                                    </a>
                                </td>
                                <td>{entry.name}</td>
                                <td>{entry.owner}</td>
                                <td>{entry.borrower || "(available)"}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Card>
        </div>
    )
}

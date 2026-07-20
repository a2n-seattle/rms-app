import { MainTable } from "../db/MainTable"
import { TagTable } from "../db/TagTable"
import { TransactionsTable } from "../db/TransactionsTable"
import { MainSchema, TagsSchema } from "../db/Schemas"
import { DBClient } from "../injection/db/DBClient"
import { MetricsClient } from "../injection/metrics/MetricsClient"
import { emitAPIMetrics } from "../metrics/MetricsHelper"

const MAX_LIST_SIZE: number = 10

/**
 * Search for a item by tags
 */
export class SearchItem {
    public static NAME: string = "search item"

    private readonly mainTable: MainTable
    private readonly tagTable: TagTable
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.mainTable = new MainTable(client)
        this.tagTable = new TagTable(client)
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    public router(number: string, request: string, scratch?: ScratchInterface): string | Promise<string> {
        if (scratch === undefined) {
            return this.transactionsTable.create(number, SearchItem.NAME)
                .then(() => "Tags to search for (separated by spaces):")
        } else {
            scratch.tags = request.split(/(\s+)/)
                .filter((str: string) => str.trim().length > 0)
                .map((str: string) => str.toLowerCase().trim())
                .reverse()
            return this.transactionsTable.delete(number)
                    .then(() => this.execute(scratch))
                    .then((search: SearchItemReturn) => {
                        if (Object.keys(search.map).length === 0) {
                            return "No items found."
                        } else {
                            let returnString: string = `${Object.keys(search.map).length} items found.`
                            search.entries.forEach((entry: MainSchema) =>
                                returnString += searchItemItem(
                                    entry,
                                    search.map[entry.id].occurrences
                            ))
    
                            return returnString
                        }
                    })
        }
    }

    /**
     * Required params for scratch object:
     * @param tags List of tags to search for, ordered in the level of importance.
     */
    public execute(scratch: ScratchInterface): Promise<SearchItemReturn> {
        return emitAPIMetrics(
            () => {
                const names: TagMap = {}
                
                return Promise.all(scratch.tags.map((tag: string, index: number) => {
                    return this.tagTable.get(tag)
                        .then((search: TagsSchema) => {
                            if (search && search.val) {
                                search.val.forEach((name: string) => {
                                    if (Object.keys(names).includes(name)) {
                                        names[name] = {
                                            name: name,
                                            occurrences: names[name].occurrences + 1,
                                            relevance: Math.min(names[name].relevance, index)
                                        }
                                    } else {
                                        names[name] = {
                                            name: name,
                                            occurrences: 1,
                                            relevance: index
                                        }
                                    }
                                })
                                
                            }
                        })
                })).then(() => {
                    return Promise.all(Object.values(names)
                        .sort((a: TagObject, b: TagObject) => {
                            return (b.occurrences - a.occurrences) + (a.relevance - b.relevance) * 0.01
                        }).slice(0, MAX_LIST_SIZE)
                        .map((value: TagObject) => this.mainTable.get(value.name)))
                }).then((entry: MainSchema[]) => {
                    return {
                        map: names,
                        entries: entry
                    }
                })
            },
            SearchItem.NAME, this.metrics
        )
    }
}

interface ScratchInterface {
    tags?: string[]
}

/**
 * @param map Map of top matches
 * @param entries Corrosponding top entry matches
 */
export interface SearchItemReturn {
    map: TagMap,
    entries: MainSchema[]
}

interface TagMap {
    [name: string]: TagObject
}

/**
 * @param name Name of item
 * @param occurrences Number of relevant tags
 * @param relevance Number of lowest index
 */
interface TagObject {
    name: string
    occurrences: number,
    relevance: number
}

export function searchItemItem(main: MainSchema, occurrences: number): string {
    return `\nName: ${main.displayName}`
        + `\n  # of relevant tags: ${occurrences}`
        + `\n  Item IDs: ${main.tags.values.toString()}`
}
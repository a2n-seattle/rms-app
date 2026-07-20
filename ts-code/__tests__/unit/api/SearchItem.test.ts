import { SearchItem, SearchItemReturn } from "../../../src/api/SearchItem"
import { DBSeed, TestConstants } from "../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../__dev__/db/LocalDBClient"

test('will search item correctly when tag exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const api: SearchItem = new SearchItem(dbClient)
    
    await api.execute({
        tags: [ TestConstants.TAG_2, TestConstants.TAG ]
    }).then((search: SearchItemReturn) => {
        expect(Object.keys(search.map).length).toEqual(2)
        expect(search.map[TestConstants.NAME].occurrences).toEqual(1)
        expect(search.map[TestConstants.NAME].relevance).toEqual(1)
        expect(search.map[TestConstants.NAME_2].occurrences).toEqual(2)
        expect(search.map[TestConstants.NAME_2].relevance).toEqual(0)
        expect(search.entries[0].id).toEqual(TestConstants.NAME_2)
        expect(search.entries[1].id).toEqual(TestConstants.NAME)
    })
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES)
})

test('will return nothing when tag does not exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const api: SearchItem = new SearchItem(dbClient)
    
    await api.execute({
        tags: [ TestConstants.BAD_REQUEST ]
    }).then((search: SearchItemReturn) => {
        expect(Object.keys(search.map).length).toEqual(0)
    })
    expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES)
})
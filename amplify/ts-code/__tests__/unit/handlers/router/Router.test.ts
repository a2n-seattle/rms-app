import { AddItem } from "../../../../src/api/AddItem"
import { BorrowBatch } from "../../../../src/api/BorrowBatch"
import { BorrowItem } from "../../../../src/api/BorrowItem"
import { CreateBatch } from "../../../../src/api/CreateBatch"
import { CreateReservation } from "../../../../src/api/CreateReservation"
import { DeleteBatch } from "../../../../src/api/DeleteBatch"
import { DeleteItem } from "../../../../src/api/DeleteItem"
import { DeleteReservation } from "../../../../src/api/DeleteReservation"
import { GetBatch, getBatchItem } from "../../../../src/api/GetBatch"
import { GetItem, getItemHeader, getItemItem } from "../../../../src/api/GetItem"
import { GetReservation, formatSchedule } from "../../../../src/api/GetReservation"
import { PrintTable } from "../../../../src/api/internal/PrintTable"
import { ReturnBatch } from "../../../../src/api/ReturnBatch"
import { ReturnItem } from "../../../../src/api/ReturnItem"
import { SearchItem, searchItemItem } from "../../../../src/api/SearchItem"
import { UpdateDescription } from "../../../../src/api/UpdateDescription"
import { UpdateItemNotes } from "../../../../src/api/UpdateItemNotes"
import { UpdateItemOwner } from "../../../../src/api/UpdateItemOwner"
import { UpdateTags } from "../../../../src/api/UpdateTags"
import { ItemsSchema, MainSchema, ScheduleSchema } from "../../../../src/db/Schemas"
import { ADVANCED_HELP_MENU, BASIC_HELP_MENU, HELP_MENU, Router } from "../../../../src/handlers/router/Router"
import { DBSeed, TestConstants, TestTimestamps } from "../../../../__dev__/db/DBTestConstants"
import { LocalDBClient } from "../../../../__dev__/db/LocalDBClient"

test('will return help menu correctly when calling help', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const router: Router = new Router(dbClient)

    await router.processRequest("help", TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual(HELP_MENU)
        })
})

test('will return basic help menu correctly when calling help basic', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const router: Router = new Router(dbClient)

    await router.processRequest("help basic", TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual(BASIC_HELP_MENU)
        })
})

test('will return advanced help menu correctly when calling help advanced', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const router: Router = new Router(dbClient)

    await router.processRequest("help advanced", TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual(ADVANCED_HELP_MENU)
        })
})

test('will complain when invalid service call is passed', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const router: Router = new Router(dbClient)

    await router.processRequest(TestConstants.BAD_REQUEST, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Invalid Request. Please reply with 'help' to get valid operations.")
        })
})

test('will complain when there is no transaction to abort', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const router: Router = new Router(dbClient)

    await router.processRequest("abort", TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("No Request to Abort.")
        })
})

test('will abort correctly when typing in command in the middle of a service dialogue', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const router: Router = new Router(dbClient)

    await router.processRequest(DeleteItem.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("ID of item:")
            return router.processRequest(TestConstants.ITEM_ID_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Type 'y' to confirm that you want to delete item: '${TestConstants.ITEM_ID_2}'`)
            return router.processRequest("abort", TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Request Reset")
            expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES)
        })
})

test('will internal print table correctly when using router', async () => {
    const tableNames: string[] = ["main", "batch", "history", "items", "tags"]

    await tableNames.forEach(async (name: string) => {
        const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
        const router: Router = new Router(dbClient)

        await router.processRequest(PrintTable.NAME, TestConstants.NUMBER)
            .then((output: string) => {
                expect(output).toEqual("Name of table: (Options: main, items, tags, batch, history, schedule, transactions)")
                return router.processRequest(name, TestConstants.NUMBER)
            }).then((output: string) => {
                expect(output).toEqual("[]\nEND")
            })
    })
})

test('will internal print table correctly when using router and invalid table name', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const router: Router = new Router(dbClient)

    await expect(() =>
        router.processRequest(PrintTable.NAME, TestConstants.NUMBER)
            .then((output: string) => {
                expect(output).toEqual("Name of table: (Options: main, items, tags, batch, history, schedule, transactions)")
                return router.processRequest(TestConstants.BAD_REQUEST, TestConstants.NUMBER)
            })
    ).rejects.toThrow("Unsupported Table Name: " + TestConstants.BAD_REQUEST)
})

test('will add item correctly when name does not exist', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.EMPTY)
    const router: Router = new Router(dbClient)

    // Mock ID
    AddItem.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.ITEM_ID));

    await router.processRequest(AddItem.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Name of item:")
            return router.processRequest(TestConstants.DISPLAYNAME, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Related Category Tags (separated by spaces):")
            return router.processRequest(TestConstants.TAG, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Optional description of this item:")
            return router.processRequest(TestConstants.DESCRIPTION, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Owner of this item (or location where it's stored if church owned):")
            return router.processRequest(TestConstants.OWNER, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Optional notes about this specific item:")
            return router.processRequest(TestConstants.NOTES, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Created Item with RMS ID: ${TestConstants.ITEM_ID}`)
            expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
        })
})

test('will add item correctly when name exists', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const router: Router = new Router(dbClient)

    // Mock ID
    AddItem.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.ITEM_ID_2));

    await router.processRequest(AddItem.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Name of item:")
            return router.processRequest(TestConstants.NAME, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Owner of this item (or location where it's stored if church owned):")
            return router.processRequest(TestConstants.OWNER_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Optional notes about this specific item:")
            return router.processRequest(TestConstants.NOTES_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Created Item with RMS ID: ${TestConstants.ITEM_ID_2}`)
            expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_TWO_ITEMS)
        })
})

test('will get item correctly when given valid id', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const router: Router = new Router(dbClient)

    const expectedMain: MainSchema = {
        id: TestConstants.NAME,
        displayName: TestConstants.DISPLAYNAME,
        description: TestConstants.DESCRIPTION,
        tags: [TestConstants.TAG],
        items: [TestConstants.ITEM_ID]
    }
    const expectedItem: ItemsSchema = {
        id: TestConstants.ITEM_ID,
        name: TestConstants.NAME,
        owner: TestConstants.OWNER,
        borrower: "",
        notes: TestConstants.NOTES,
        batch: [],
        history: [],
        schedule: []
    }
    const expectedStr: string = getItemHeader(expectedMain) + getItemItem(expectedItem)

    await router.processRequest(GetItem.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Name or ID of item:")
            return router.processRequest(TestConstants.ITEM_ID, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(expectedStr)
        })
})

test('will update description correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const router: Router = new Router(dbClient)

    await router.processRequest(UpdateDescription.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Name of item:")
            return router.processRequest(TestConstants.NAME, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("New Description:")
            return router.processRequest(TestConstants.DESCRIPTION_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Successfully updated description of '${TestConstants.NAME}'`)
            expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_CHANGE_DESCRIPTION)
        })
})

test('will update item notes correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const router: Router = new Router(dbClient)

    await router.processRequest(UpdateItemNotes.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("ID of item:")
            return router.processRequest(TestConstants.ITEM_ID, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("New Note:")
            return router.processRequest(TestConstants.NOTES_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Successfully updated notes about item '${TestConstants.ITEM_ID}'`)
            expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_CHANGE_NOTE)
        })
})

test('will update item owner correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const router: Router = new Router(dbClient)

    await router.processRequest(UpdateItemOwner.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("ID of item:")
            return router.processRequest(TestConstants.ITEM_ID, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Current Owner (or location where it's stored if church owned):")
            return router.processRequest(TestConstants.OWNER, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("New Owner (or location where it's stored if church owned):")
            return router.processRequest(TestConstants.OWNER_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Successfully updated owner for item '${TestConstants.ITEM_ID}'`)
            expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_CHANGE_OWNER)
        })
})

test('will update tags correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const router: Router = new Router(dbClient)

    await router.processRequest(UpdateTags.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Name of item:")
            return router.processRequest(TestConstants.NAME, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("New Tags (separated by spaces):")
            return router.processRequest(TestConstants.TAG_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Successfully updated tags for '${TestConstants.NAME}'`)
            expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_CHANGE_TAGS)
        })
})

test('will search item correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const router: Router = new Router(dbClient)

    const expected: MainSchema = {
        id: TestConstants.NAME,
        displayName: TestConstants.DISPLAYNAME,
        description: TestConstants.DESCRIPTION,
        tags: [TestConstants.TAG],
        items: [TestConstants.ITEM_ID]
    }

    await router.processRequest(SearchItem.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Tags to search for (separated by spaces):")
            return router.processRequest(TestConstants.TAG, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(
                "1 items found."
                + searchItemItem(expected, 1)
            )
        })
})

test('will search item correctly when using router and bad tag', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const router: Router = new Router(dbClient)

    await router.processRequest(SearchItem.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Tags to search for (separated by spaces):")
            return router.processRequest(TestConstants.BAD_REQUEST, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("No items found.")
        })
})

test('will borrow item correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME)
    const router: Router = new Router(dbClient)

    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_ITEM)

    await router.processRequest(BorrowItem.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("IDs of Items (separated by spaces):")
            return router.processRequest(TestConstants.ITEM_ID, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Name of intended borrower:")
            return router.processRequest(TestConstants.BORROWER, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Optional notes to leave about this action:")
            return router.processRequest(TestConstants.NOTES, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Successfully borrowed items '${TestConstants.ITEM_ID}'.`)
            expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_BORROWED)
        })
})

test('will return item correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.ONE_NAME_BORROWED)
    const router: Router = new Router(dbClient)

    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.RETURN_ITEM)

    await router.processRequest(ReturnItem.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("IDs of Items (separated by spaces):")
            return router.processRequest(TestConstants.ITEM_ID, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Name of current borrower:")
            return router.processRequest(TestConstants.BORROWER, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Optional notes to leave about this action:")
            return router.processRequest(TestConstants.NOTES_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Successfully returned items '${TestConstants.ITEM_ID}'.`)
            expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME_RETURNED)
        })
})

test('will create reservation correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const router: Router = new Router(dbClient)

    // Mock ID
    CreateReservation.prototype.getUniqueId = jest.fn(() => Promise.resolve(TestConstants.RESERVATION_ID));

    await router.processRequest(CreateReservation.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("IDs of Items (separated by spaces):")
            return router.processRequest(`${TestConstants.ITEM_ID} ${TestConstants.ITEM_ID_2}`, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Name of intended borrower:")
            return router.processRequest(TestConstants.BORROWER, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Start time of reservation in yyyy-mm-dd-hr-min (Ex: 2022-23-02-20-30 for 2022 Feb 23 8:30PM)")
            return router.processRequest(TestTimestamps.START_DATE, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("End time of reservation in yyyy-mm-dd-hr-min (Ex: 2022-23-02-20-30 for 2022 Feb 23 8:30PM)")
            return router.processRequest(TestTimestamps.END_DATE, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Optional notes to leave about this action:")
            return router.processRequest(TestConstants.NOTES, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Created reservation with reservation ID: ${TestConstants.RESERVATION_ID}`)
            expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
        })
})

test('will get reservation correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const router: Router = new Router(dbClient)

    const expectedReservation: ScheduleSchema = {
        id: TestConstants.RESERVATION_ID,
        borrower: TestConstants.BORROWER,
        itemIds: [TestConstants.ITEM_ID, TestConstants.ITEM_ID_2],
        startTime: TestTimestamps.START_DATE,
        endTime: TestTimestamps.END_DATE,
        notes: TestConstants.NOTES
    }

    const expectedStr: string = formatSchedule(expectedReservation)

    router.processRequest(GetReservation.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("ID of reservation:")
            return router.processRequest(TestConstants.RESERVATION_ID, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(expectedStr)
            expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
        })
})

test('will delete reservation correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_RESERVED)
    const router: Router = new Router(dbClient)

    router.processRequest(DeleteReservation.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("ID of reservation:")
            return router.processRequest(TestConstants.RESERVATION_ID, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Successfully deleted reservation '${TestConstants.RESERVATION_ID}'.`)
            expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
        })
})

test('will create batch correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const router: Router = new Router(dbClient)

    await router.processRequest(CreateBatch.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Name of Batch:")
            return router.processRequest(TestConstants.BATCH, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("List of IDs (separated by spaces):")
            return router.processRequest(TestConstants.ITEM_ID + " " + TestConstants.ITEM_ID_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("List of Groups this batch belongs to (separated by spaces):")
            return router.processRequest(TestConstants.GROUP, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Successfully created batch '${TestConstants.BATCH}'`)
            expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
        })
})

test('will get batch correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const router: Router = new Router(dbClient)

    await router.processRequest(GetBatch.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Name of Batch:")
            return router.processRequest(TestConstants.BATCH, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(
                `batch: ${TestConstants.BATCH}`
                + getBatchItem(TestConstants.ITEM_ID, TestConstants.DISPLAYNAME, TestConstants.OWNER, "")
                + getBatchItem(TestConstants.ITEM_ID_2, TestConstants.NAME_2, TestConstants.OWNER_2, "")
            )
        })
})

test('will borrow batch correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH)
    const router: Router = new Router(dbClient)

    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.BORROW_BATCH)

    await router.processRequest(BorrowBatch.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Name of Batch:")
            return router.processRequest(TestConstants.BATCH, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Name of intended borrower:")
            return router.processRequest(TestConstants.BORROWER, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("Optional notes to leave about this action:")
            return router.processRequest(TestConstants.NOTES, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Successfully borrowed items in batch '${TestConstants.BATCH}'`)
            expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
        })
})

test('will return batch correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_ONE_BATCH_BORROWED)
    const router: Router = new Router(dbClient)

    // Mock Date
    Date.now = jest.fn(() => TestTimestamps.RETURN_BATCH)

    await router.processRequest(ReturnBatch.NAME, TestConstants.NUMBER)
    .then((output: string) => {
        expect(output).toEqual("Name of Batch:")
        return router.processRequest(TestConstants.BATCH, TestConstants.NUMBER)
    }).then((output: string) => {
        expect(output).toEqual("Name of current borrower:")
        return router.processRequest(TestConstants.BORROWER, TestConstants.NUMBER)
    }).then((output: string) => {
        expect(output).toEqual("Optional notes to leave about this action:")
        return router.processRequest(TestConstants.NOTES_2, TestConstants.NUMBER)
    }).then((output: string) => {
        expect(output).toEqual(`Successfully returned items in batch '${TestConstants.BATCH}'`)
        expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH_RETURNED)
    })
})

test('will delete batch correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES_TWO_BATCH)
    const router: Router = new Router(dbClient)

    await router.processRequest(DeleteBatch.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("Name of Batch:")
            return router.processRequest(TestConstants.BATCH_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Type 'y' to confirm that you want to delete batch: '${TestConstants.BATCH_2}'`)
            return router.processRequest("not y", TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("ERROR: Didn't receive 'y'. Please reply again with a 'y' to proceed with deleting the object, or 'abort' to abort the transaction.")
            return router.processRequest("y", TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Successfully deleted batch '${TestConstants.BATCH_2}'`)
            expect(dbClient.getDB()).toEqual(DBSeed.TWO_NAMES_ONE_BATCH)
        })
})

test('will delete item correctly when using router', async () => {
    const dbClient: LocalDBClient = new LocalDBClient(DBSeed.TWO_NAMES)
    const router: Router = new Router(dbClient)

    await router.processRequest(DeleteItem.NAME, TestConstants.NUMBER)
        .then((output: string) => {
            expect(output).toEqual("ID of item:")
            return router.processRequest(TestConstants.ITEM_ID_2, TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Type 'y' to confirm that you want to delete item: '${TestConstants.ITEM_ID_2}'`)
            return router.processRequest("not y", TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual("ERROR: Didn't receive 'y'. Please reply again with a 'y' to proceed with deleting the object, or 'abort' to abort the transaction.")
            return router.processRequest("y", TestConstants.NUMBER)
        }).then((output: string) => {
            expect(output).toEqual(`Deleted a '${TestConstants.NAME_2}' from the inventory.`)
            expect(dbClient.getDB()).toEqual(DBSeed.ONE_NAME)
        })
})
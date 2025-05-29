export enum DBSeed {
    EMPTY = require("../../../resources/seeds/empty.json"),
    ONE_NAME = require("../../../resources/seeds/one-name.json"),
    ONE_NAME_BORROWED = require("../../../resources/seeds/one-name-borrowed.json"),
    ONE_NAME_RETURNED = require("../../../resources/seeds/one-name-returned.json"),
    ONE_NAME_CHANGE_DESCRIPTION = require("../../../resources/seeds/one-name-change-description.json"),
    ONE_NAME_CHANGE_NOTE = require("../../../resources/seeds/one-name-change-note.json"),
    ONE_NAME_CHANGE_OWNER = require("../../../resources/seeds/one-name-change-owner.json"),
    ONE_NAME_CHANGE_TAGS = require("../../../resources/seeds/one-name-change-tags.json"),
    ONE_NAME_TWO_ITEMS = require("../../../resources/seeds/one-name-two-items.json"),
    TWO_NAMES = require("../../../resources/seeds/two-names.json"),
    TWO_NAMES_FAIL_CREATE = require("../../../resources/seeds/two-names-fail-create.json"),
    TWO_NAMES_ONE_BATCH = require("../../../resources/seeds/two-names-one-batch.json"),
    TWO_NAMES_ONE_BATCH_BORROWED = require("../../../resources/seeds/two-names-one-batch-borrowed.json"),
    TWO_NAMES_ONE_BATCH_PARTIALLY_BORROWED = require("../../../resources/seeds/two-names-one-batch-partially-borrowed.json"),
    TWO_NAMES_ONE_BATCH_RETURNED = require("../../../resources/seeds/two-names-one-batch-returned.json"),
    TWO_NAMES_ONE_BATCH_MODIFIED = require("../../../resources/seeds/two-names-one-batch-modified.json"),
    TWO_NAMES_ONE_BATCH_RESERVED = require("../../../resources/seeds/two-names-one-batch-reserved.json"),
    TWO_NAMES_TWO_BATCH = require("../../../resources/seeds/two-names-two-batch.json")
}

export enum TestConstants {
    EMAIL = "test@email.com",
    PASSWORD = "Passw0rd",
    NUMBER = "test number",
    BAD_REQUEST = "bad request",

    NAME = "test name",
    DISPLAYNAME = "Test Name",
    NAME_2 = "test name 2",
    DESCRIPTION = "test description",
    DESCRIPTION_2 = "test description 2",
    TAG = "tag1",
    TAG_2 = "tag2",
    BATCH = "test batch",
    BATCH_2 = "test batch 2",
    GROUP = "group1",

    ITEM_ID = "123",
    ITEM_ID_2 = "12345",
    OWNER = "test owner",
    OWNER_2 = "test owner 2",
    BORROWER = "test borrower",
    BORROWER_2 = "test borrower 2",
    NOTES = "test note",
    NOTES_2 = "test note 2",

    RESERVATION_ID = "123-12345",
    RESERVATION_ID_2 = "321-54321",
    START_DATE = "2022-02-23-08-30",
    END_DATE = "2022-02-25-08-30",
    START_DATE_2 = "2022-02-24-10-30",
    END_DATE_2 = "2022-02-25-05-30",
    START_DATE_3 = "2022-02-22-05-30"
}

export enum TestTimestamps {
    BORROW_ITEM = 1000000000000,
    RETURN_ITEM = 1000000000001,
    BORROW_BATCH = 1000000000010,
    RETURN_BATCH = 1000000000011
}
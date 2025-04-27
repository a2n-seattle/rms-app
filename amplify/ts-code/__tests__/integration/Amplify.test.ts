import { ICredentials } from '@aws-amplify/core'
import { Amplify, Auth, DataStore } from 'aws-amplify'
import { InvocationResponse } from 'aws-sdk/clients/lambda'
import { TestConstants } from "../../__dev__/db/DBTestConstants"
import AWS = require('aws-sdk')
import Lambda = require( 'aws-sdk/clients/lambda')
const awsExports = require('../../../../src/aws-exports').default

const ENV_SUFFIX = '-alpha'

describe('Amplify Tests', () => {
    beforeAll(async () => {
        Amplify.configure(awsExports)
    })

    /**
     * add item and delete item using api
    */
    test('will run successfully when write apis are called', async() => {
        // Setup Credentials
        const credentials: ICredentials = await Auth.currentCredentials()
        AWS.config.credentials = credentials
        const lambda = new Lambda({
            credentials: credentials,
            region: awsExports.aws_project_region
        })

        // Add Item
        const addItemResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `AddItem${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.DISPLAYNAME,
                description: TestConstants.DESCRIPTION,
                tags: [TestConstants.TAG],
                owner: TestConstants.OWNER,
                notes: TestConstants.NOTES
            })
        }).promise()
        const itemId = addItemResponse.Payload.toString().substr(1, addItemResponse.Payload.toString().length - 2)
        
        // Update Description
        const updateDescriptionResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `UpdateDescription${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.DISPLAYNAME,
                description: TestConstants.DESCRIPTION
            })
        }).promise()
        expect(updateDescriptionResponse.Payload.toString()).toEqual(`"Successfully updated description of '${TestConstants.DISPLAYNAME}'"`)

        // Update Tags
        const updateTagsResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `UpdateTags${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.DISPLAYNAME,
                tags: [TestConstants.TAG]
            })
        }).promise()
        expect(updateTagsResponse.Payload.toString()).toEqual(`"Successfully updated tags for '${TestConstants.DISPLAYNAME}'"`)

        // Update Item Owner
        const updateItemOwnerResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `UpdateItemOwner${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                id: itemId,
                currentOwner: TestConstants.OWNER,
                newOwner: TestConstants.OWNER
            })
        }).promise()
        expect(updateItemOwnerResponse.Payload.toString()).toEqual(`"Successfully updated owner for item '${itemId}'"`)

        // Update Item Notes
        const updateItemNotesResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `UpdateItemNotes${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                id: itemId,
                note: TestConstants.NOTES
            })
        }).promise()
        expect(updateItemNotesResponse.Payload.toString()).toEqual(`"Successfully updated notes about item '${itemId}'"`)

        // Borrow Item
        const borrowItemResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `BorrowItem${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                ids: [itemId],
                borrower: TestConstants.BORROWER,
                notes: TestConstants.NOTES
            })
        }).promise()
        expect(borrowItemResponse.Payload.toString()).toEqual(`"Successfully borrowed items '${itemId}'."`)

        // Return Item
        const returnItemResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `ReturnItem${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                ids: [itemId],
                borrower: TestConstants.BORROWER,
                notes: TestConstants.NOTES
            })
        }).promise()
        expect(returnItemResponse.Payload.toString()).toEqual(`"Successfully returned items '${itemId}'."`)

        // Create Reservation
        const createReservationResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `CreateReservation${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                borrower: TestConstants.BORROWER,
                ids: [itemId],
                startTime: TestConstants.START_DATE,
                endTime: TestConstants.END_DATE,
                notes: TestConstants.NOTES
            })
        }).promise()
        const reservationId = createReservationResponse.Payload.toString().substr(1, createReservationResponse.Payload.toString().length - 2)

        // Delete Reservation
        const deleteReservationResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `DeleteReservation${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                id: reservationId
            })
        }).promise()
        expect(deleteReservationResponse.Payload.toString()).toEqual(`"Successfully deleted reservation '${reservationId}'."`)

        // Create Batch
        const createBatchResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `CreateBatch${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.BATCH,
                ids: [itemId],
                groups: [TestConstants.GROUP]
            })
        }).promise()
        expect(createBatchResponse.Payload.toString()).toEqual(`"Successfully created batch '${TestConstants.BATCH}'"`)

        // Borrow Batch
        const borrowBatchResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `BorrowBatch${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.BATCH,
                borrower: TestConstants.BORROWER,
                notes: TestConstants.NOTES
            })
        }).promise()
        expect(borrowBatchResponse.Payload.toString()).toEqual(`"Successfully borrowed items in batch '${TestConstants.BATCH}'"`)

        // Return Batch
        const returnBatchResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `ReturnBatch${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.BATCH,
                borrower: TestConstants.BORROWER,
                notes: TestConstants.NOTES
            })
        }).promise()
        expect(returnBatchResponse.Payload.toString()).toEqual(`"Successfully returned items in batch '${TestConstants.BATCH}'"`)

        // Delete Batch
        const deleteBatchResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `DeleteBatch${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.BATCH
            })
        }).promise()
        expect(deleteBatchResponse.Payload.toString()).toEqual(`"Successfully deleted batch '${TestConstants.BATCH}'"`)

        // Delete Item
        const deleteItemResponse: InvocationResponse = await lambda.invoke({
            FunctionName: `DeleteItem${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                id: itemId,
                name: TestConstants.DISPLAYNAME,
                description: TestConstants.DESCRIPTION,
                tags: [TestConstants.TAG],
                owner: TestConstants.OWNER,
                notes: TestConstants.NOTES
            })
        }).promise()
        expect(deleteItemResponse.Payload.toString()).toEqual(`"Deleted a '${TestConstants.NAME}' from the inventory."`)
    }, 100000)

    /**
      * read from empty table using DataStore
      * TODO: Fix this test. Doesn't work. Jeremy thinks that it's because it's unable to spin up a local Datastore.
     test('will return data when datastore is called', async () => {
        await expect(
            DataStore.query(Main)
                .then((output: Main[]) => {
                    return output
                })
        ).resolves.toBeDefined()
    }, 10000)
    */
});
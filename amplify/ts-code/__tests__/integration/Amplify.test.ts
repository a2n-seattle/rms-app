import { Amplify } from 'aws-amplify'
import { AuthSession, fetchAuthSession, signIn, SignInOutput, signOut } from 'aws-amplify/auth';
import { InvokeCommandOutput, Lambda } from '@aws-sdk/client-lambda';
import { TestConstants, TestTimestamps } from "../../__dev__/db/DBTestConstants"
const awsExports = require('../../../../src/aws-exports').default

const ENV_SUFFIX = '-alpha'

describe('Amplify Tests', () => {
    beforeAll(async () => {
        Amplify.configure(awsExports)
    })

    /**
     * One time use. Leaving here for completeness.
     * 
    test('will sign up when api is called', async () => {
        await expect(
            signUp({
            username: TestConstants.EMAIL,
            password: TestConstants.PASSWORD,
            options: { userAttributes: {
                email: TestConstants.EMAIL,
                name: TestConstants.OWNER
            } }
        })).resolves
    })
     */

    /**
     * AUTH: Sign In
    */
    test('will sign in when api is called', async () => {
        await expect(
            signIn({
                username: TestConstants.EMAIL,
                password: TestConstants.PASSWORD
            }).then((singInOutput : SignInOutput) => singInOutput.isSignedIn)
        ).resolves.toEqual(true)
    }, 100000)

    /**
     * add item and delete item using api
    */
    test('will run successfully when write apis are called', async() => {
        // Setup Credentials
        const authSession: AuthSession = await fetchAuthSession()
        const lambda = new Lambda({
            credentials: authSession.credentials,
            region: awsExports.aws_project_region
        })

        // Add Item
        const addItemResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `AddItem${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.DISPLAYNAME,
                description: TestConstants.DESCRIPTION,
                tags: [TestConstants.TAG],
                owner: TestConstants.OWNER,
                notes: TestConstants.NOTES
            })
        })
        const itemId = addItemResponse.Payload.transformToString().substring(1, addItemResponse.Payload.transformToString().length - 1)
        expect(itemId).toContain("test_name-")
        
        // Update Tags
        const updateTagsResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `UpdateTags${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.DISPLAYNAME,
                tags: [TestConstants.TAG]
            })
        })
        expect(updateTagsResponse.Payload.transformToString()).toEqual(`"Successfully updated tags for '${TestConstants.DISPLAYNAME}'"`)

        // Borrow Item
        const borrowItemResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `BorrowItem${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                ids: [itemId],
                borrower: TestConstants.BORROWER,
                notes: TestConstants.NOTES
            })
        })
        expect(borrowItemResponse.Payload.transformToString()).toEqual(`"Successfully borrowed items '${itemId}'."`)

        // Borrow From Schedule
        const borrowFromScheduleResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `BorrowFromSchedule${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                scheduleId: TestConstants.RESERVATION_ID,
                notes: TestConstants.NOTES
            })
        })
        expect(borrowFromScheduleResponse.Payload.transformToString()).toEqual(`"Successfully borrowed items from schedule '${TestConstants.RESERVATION_ID}'"`)

        // Return Item
        const returnItemResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `ReturnItem${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                ids: [itemId],
                borrower: TestConstants.BORROWER,
                notes: TestConstants.NOTES
            })
        })
        expect(returnItemResponse.Payload.transformToString()).toEqual(`"Successfully returned items '${itemId}'."`)

        // Create Reservation
        const createReservationResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `CreateReservation${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                borrower: TestConstants.BORROWER,
                ids: [itemId],
                startTime: TestTimestamps.START_DATE,
                endTime: TestTimestamps.END_DATE,
                notes: TestConstants.NOTES
            })
        })
        const reservationId = createReservationResponse.Payload.transformToString().substring(1, createReservationResponse.Payload.transformToString().length - 1)
        expect(reservationId).toContain("-test_name-")

        // Delete Reservation
        const deleteReservationResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `DeleteReservation${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                id: reservationId
            })
        })
        expect(deleteReservationResponse.Payload.transformToString()).toEqual(`"Successfully deleted reservation '${reservationId}'."`)

        // Create Batch
        const createBatchResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `CreateBatch${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.BATCH,
                ids: [itemId],
                groups: [TestConstants.GROUP]
            })
        })
        expect(createBatchResponse.Payload.transformToString()).toEqual(`"Successfully created batch '${TestConstants.BATCH}'"`)

        // Borrow Batch
        const borrowBatchResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `BorrowBatch${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.BATCH,
                borrower: TestConstants.BORROWER,
                notes: TestConstants.NOTES
            })
        })
        expect(borrowBatchResponse.Payload.transformToString()).toEqual(`"Successfully borrowed items in batch '${TestConstants.BATCH}'"`)

        // Return Batch
        const returnBatchResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `ReturnBatch${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.BATCH,
                borrower: TestConstants.BORROWER,
                notes: TestConstants.NOTES
            })
        })
        expect(returnBatchResponse.Payload.transformToString()).toEqual(`"Successfully returned items in batch '${TestConstants.BATCH}'"`)

        // Delete Batch
        const deleteBatchResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `DeleteBatch${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                name: TestConstants.BATCH
            })
        })
        expect(deleteBatchResponse.Payload.transformToString()).toEqual(`"Successfully deleted batch '${TestConstants.BATCH}'"`)

        // Delete Item
        const deleteItemResponse: InvokeCommandOutput = await lambda.invoke({
            FunctionName: `DeleteItem${ENV_SUFFIX}`,
            Payload: JSON.stringify({
                id: itemId,
                name: TestConstants.DISPLAYNAME,
                description: TestConstants.DESCRIPTION,
                tags: [TestConstants.TAG],
                owner: TestConstants.OWNER,
                notes: TestConstants.NOTES
            })
        })
        expect(deleteItemResponse.Payload.transformToString()).toEqual(`"Deleted a '${TestConstants.NAME}' from the inventory."`)
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

    /**
     * AUTH: Sign Out
     */
    test('will sign out when api is called', async () => {
        await expect(
            signOut()
                .then(() => fetchAuthSession())
        ).rejects.toThrow("Unauthenticated access is not supported for this identity pool.")
    })
});
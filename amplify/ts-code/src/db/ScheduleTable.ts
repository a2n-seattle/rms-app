import { SCHEDULE_TABLE, ScheduleSchema, ITEMS_TABLE, ItemsSchema } from "./Schemas";
import { DBClient } from "../injection/db/DBClient"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

export class ScheduleTable {
    private readonly client: DBClient

    public constructor(client: DBClient) {
        this.client = client
    }

    /**
     * Adds reservation to Schedule Table
     */
    public create(
        id: string,
        borrower: string,
        itemIds: string[],
        startTime: string,
        endTime: string,
        notes: string,
    ): Promise<string> {
        return this.get(id)
            .then((entry: ScheduleSchema) => {
                if (entry) {
                    throw Error(`Schedule ID ${id} is not unique.`)
                } else {
                    const reservation: ScheduleSchema = {
                        id: id,
                        borrower: borrower,
                        itemIds: itemIds,
                        startTime: startTime,
                        endTime: endTime,
                        notes: notes
                    }

                    const indexParams: DocumentClient.PutItemInput = {
                        TableName: SCHEDULE_TABLE,
                        Item: reservation
                    }

                    if (Array.from(new Set(itemIds)).length !== itemIds.length) {
                        throw Error("Duplicate itemIds were passed in")
                    }

                    return Promise.all((itemIds.map((itemId: string) => {
                        const getItemsParams: DocumentClient.GetItemInput = {
                            TableName: ITEMS_TABLE,
                            Key: {
                                "id": itemId
                            }
                        }
                        return this.client.get(getItemsParams)
                        .then((output: DocumentClient.GetItemOutput) => {
                            const item: ItemsSchema = output.Item as ItemsSchema
                            if (item) {
                                return Promise.all((item.schedule.map((reservationId: string) => {
                                    return this.get(reservationId)
                                        .then((output: ScheduleSchema) => {
                                        if (this.validateDate(output.startTime, output.endTime, startTime, endTime)) {
                                            throw Error(`Item ${itemId} is reserved starting ${output.startTime} and ending ${output.endTime}`)
                                        }
                                        })
                                })))
                            } else {
                                throw Error(`Unable to find itemId ${itemId}`)
                            }
                        })
                        .then(() => itemId)
                    })))
                    .then(() => this.client.put(indexParams))
                    .then(() => Promise.all((itemIds.map((itemId: string) => {
                        const getItemsParams: DocumentClient.GetItemInput = {
                            TableName: ITEMS_TABLE,
                            Key: {
                                "id": itemId
                            }
                        }
                        return this.client.get(getItemsParams)
                        .then((output: DocumentClient.GetItemOutput) => {
                            const item: ItemsSchema = output.Item as ItemsSchema
                            if (item) {
                                const itemsParams: DocumentClient.UpdateItemInput = {
                                    TableName: ITEMS_TABLE,
                                    Key: {
                                        "id": itemId
                                    },
                                    UpdateExpression: "SET #key = list_append(#key, :val)",
                                    ExpressionAttributeNames: {
                                        "#key": "schedule"
                                    },
                                    ExpressionAttributeValues: {
                                        ":val": [id]
                                    }
                                }
                                return this.client.update(itemsParams)
                            } else {
                                throw Error(`Unable to find itemId ${itemId}`)
                            }
                        })
                        .then(() => itemId)
                    }))))
                    .then(() => id)
                }
            })
    }

    /**
     * Delete Schedule if it exists. Returns corresponding name of Schedule
     */
    public delete(
        id: string
    ): Promise<string[]> {
        return this.get(id)
            .then((entry: ScheduleSchema) => {
                if (entry) {

                    const scheduleParams: DocumentClient.DeleteItemInput = {
                        TableName: SCHEDULE_TABLE,
                        Key: {
                            "id": id
                        }
                    }

                    return this.client.delete(scheduleParams)
                        .then(() => entry.itemIds.reduce((prev: Promise<any>, itemId: string) => {
                            const getItemsParams: DocumentClient.GetItemInput = {
                                TableName: ITEMS_TABLE,
                                Key: {
                                    "id": itemId
                                }
                            }
                            return prev
                                .then(() => this.client.get(getItemsParams))
                                .then((output: DocumentClient.GetItemOutput) => {
                                    const item: ItemsSchema = output.Item as ItemsSchema
                                    
                                    if (item) {
                                        const updateItemsParams: DocumentClient.UpdateItemInput = {
                                            TableName: ITEMS_TABLE,
                                            Key: {
                                                "id": itemId
                                            },
                                            UpdateExpression: `REMOVE #key[${item.schedule.indexOf(id)}]`,
                                            ExpressionAttributeNames: {
                                                "#key": "schedule"
                                            }
                                        }
                                        return this.client.update(updateItemsParams)
                                    } else {
                                        throw Error(`Unable to find itemId ${itemId}`)
                                    }
                                })
                        }, Promise.resolve()))
                        .then(() => entry.itemIds)
                } else {
                    throw Error(`Schedule ${id} doesn't exist.`)
                }
            })
    }

    /**
     * Get reservation from id
     * returns null if reservation not found.
     */
    public get(
        id: string
    ): Promise<ScheduleSchema> {
        const params: DocumentClient.GetItemInput = {
            TableName: SCHEDULE_TABLE,
            Key: {
                "id": id
            }
        }
        return this.client.get(params)
            .then((output: DocumentClient.GetItemOutput) => {
                if (output) {
                    return output.Item as ScheduleSchema
                } else {
                    return undefined
                }
            })
    }

    /**
     * Validates if the given date ranges conflict
     * @param startDate1 starting date of the first time range. Given in yyyy-mm-dd-hr-min fomat
     * @param endDate1 end date of the first time range. Given in yyyy-mm-dd-hr-min fomat
     * @param startDate2 starting date of the second time range. Given in yyyy-mm-dd-hr-min fomat
     * @param endDate2 end date of the second time range. Given in yyyy-mm-dd-hr-min fomat
     * @returns Returns true if (startDate1, endDate1) overlaps with the date range of (startDate2, endDate2). Returns false otherwise
     */
         private validateDate(startDate1: string, endDate1:string, startDate2: string, endDate2: string): boolean {
            // Arrays split into: year = [0], month = [1], day = [2], hour = [3], minute = [4]
            const oldStartTimeArr = startDate1.split("-").map((num) => parseInt(num, 10))
            const oldStartTime = new Date(oldStartTimeArr[0], oldStartTimeArr[1], oldStartTimeArr[2], oldStartTimeArr[3], oldStartTimeArr[4], 0)
            const oldEndTimeArr = endDate1.split("-").map((num) => parseInt(num, 10))
            const oldEndTime = new Date(oldEndTimeArr[0], oldEndTimeArr[1], oldEndTimeArr[2], oldEndTimeArr[3], oldEndTimeArr[4], 0)
            const newStartTimeArr = startDate2.split("-").map((num) => parseInt(num, 10))
            const newStartTime = new Date(newStartTimeArr[0], newStartTimeArr[1], newStartTimeArr[2], newStartTimeArr[3], newStartTimeArr[4], 0)
            const newEndTimeArr = endDate2.split("-").map((num) => parseInt(num, 10))
            const newEndTime = new Date(newEndTimeArr[0], newEndTimeArr[1], newEndTimeArr[2], newEndTimeArr[3], newEndTimeArr[4], 0)
            return (newStartTime >= oldStartTime && newStartTime <= oldEndTime) || (newEndTime >= oldStartTime && newEndTime <= oldEndTime)
    }
}
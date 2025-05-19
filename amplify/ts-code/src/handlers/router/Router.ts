import { TransactionsTable } from "../../db/TransactionsTable"
import { TransactionsSchema } from "../../db/Schemas"
import { DBClient } from "../../injection/db/DBClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { DocumentClient } from "aws-sdk/clients/dynamodb"

import { PrintTable } from "../../api/internal/PrintTable"
import { GetItem } from "../../api/GetItem"
import { SearchItem } from "../../api/SearchItem"
import { BorrowItem } from "../../api/BorrowItem"
import { ReturnItem } from "../../api/ReturnItem"
import { AddItem } from "../../api/AddItem"
import { UpdateTags } from "../../api/UpdateTags"
import { UpdateDescription } from "../../api/UpdateDescription"
import { UpdateItemNotes } from "../../api/UpdateItemNotes"
import { UpdateItemOwner } from "../../api/UpdateItemOwner"
import { DeleteItem } from "../../api/DeleteItem"
import { CreateBatch } from "../../api/CreateBatch"
import { GetBatch } from "../../api/GetBatch"
import { DeleteBatch } from "../../api/DeleteBatch"
import { BorrowBatch } from "../../api/BorrowBatch"
import { ReturnBatch } from "../../api/ReturnBatch"
import { CreateReservation } from "../../api/CreateReservation"
import { DeleteReservation } from "../../api/DeleteReservation"
import { GetReservation } from "../../api/GetReservation"

export const HELP_MENU: string = "Note that all incoming strings are processed with the following assumptions:\n"
    + "- All incoming strings are made into lowercase.\n"
    + "- The keyword 'none' is replaced with an empty string. \n"
    + "Main Operations:\n"
    + "- 'abort': Reset ongoing request\n"
    + "- 'help': Returns this help menu\n"
    + "- 'help basic': Returns information about basic operations\n"
    + "- 'help advanced': Returns information about advanced operations\n"

export const BASIC_HELP_MENU: string = "Basic Operations:\n"
    + "- 'get item': Get details of item by item name or by item id. \n"
    + "- 'search item': Search for items by tags\n"
    + "- 'borrow item': Mark item as borrowed.\n"
    + "- 'return item': Mark borrowed item as returned.\n"
    + "- 'get batch': Get info about a batch\n"
    + "- 'borrow batch': Borrow all items in a batch.\n"
    + "- 'return batch': Return all items in a batch.\n"
    + "- 'create reservation': Creates Reservation to borrow items.\n"
    + "- 'delete reservation': Deletes Reservation for items.\n"
    + "- 'get reservation': Get Reservation by ID."

export const ADVANCED_HELP_MENU: string = "Mutating Operations:\n"
    + "- 'add item': Add new item to the database.\n"
    + "- 'delete item': Delete item from database, by item id.\n"
    + "- 'update description': Update description of a certain item family.\n"
    + "- 'update tags':  Update search tags for a certain item family.\n"
    + "- 'update item notes': Update notes about the specific item.\n"
    + "- 'update item owner': Update of a specific item.\n"
    + "- 'create batch': Create new batch, override existing batch if exists.\n"
    + "- 'delete batch': Delete batch."

export class Router {
    private readonly client: DBClient
    private readonly transactionsTable: TransactionsTable
    private readonly metrics?: MetricsClient

    public constructor(client: DBClient, metrics?: MetricsClient) {
        this.client = client
        this.transactionsTable = new TransactionsTable(client)
        this.metrics = metrics
    }

    /**
     * Process given request string.
     *
     * @param request String to process.
     * @param number Corresponding unique number, which is used to identify transactions from a given source.
     */
    public processRequest(request: string | number, number: string): Promise<string> {

        let processedRequest = request.toString().trim()
        processedRequest = (processedRequest === "none") ? "" : processedRequest

        return this.transactionsTable.get(number)
            .then((data: DocumentClient.GetItemOutput) => {
                if (data.Item) {
                    const entry: TransactionsSchema = data.Item as TransactionsSchema
                    return this.routeRequest(number, processedRequest, entry.type, entry.scratch)
                } else {
                    return this.routeRequest(number, processedRequest, processedRequest)
                }
            })
            .catch((reason: any) => {
                console.error(reason)
                throw reason
            })
    }

    private routeRequest(
        number: string,
        request: string,
        type: string,
        scratch?: any
    ): string | PromiseLike<string> {
        if (request === "abort") {
            return this.abort(number, scratch)
        } else if (type === PrintTable.NAME) {
            return new PrintTable(this.client, this.metrics).router(number, request, scratch)
        } else if (type === GetItem.NAME) {
            return new GetItem(this.client, this.metrics).router(number, request, scratch)
        } else if (type === SearchItem.NAME) {
            return new SearchItem(this.client, this.metrics).router(number, request, scratch)
        } else if (type === BorrowItem.NAME) {
            return new BorrowItem(this.client, this.metrics).router(number, request, scratch)
        } else if (type === ReturnItem.NAME) {
            return new ReturnItem(this.client, this.metrics).router(number, request, scratch)
        } else if (type === AddItem.NAME) {
            return new AddItem(this.client, this.metrics).router(number, request, scratch)
        } else if (type === UpdateDescription.NAME) {
            return new UpdateDescription(this.client, this.metrics).router(number, request, scratch)
        } else if (type === UpdateTags.NAME) {
            return new UpdateTags(this.client, this.metrics).router(number, request, scratch)
        } else if (type === UpdateItemNotes.NAME) {
            return new UpdateItemNotes(this.client, this.metrics).router(number, request, scratch)
        } else if (type === UpdateItemOwner.NAME) {
            return new UpdateItemOwner(this.client, this.metrics).router(number, request, scratch)
        } else if (type === DeleteItem.NAME) {
            return new DeleteItem(this.client, this.metrics).router(number, request, scratch)
        } else if (type === GetBatch.NAME) {
            return new GetBatch(this.client, this.metrics).router(number, request, scratch)
        } else if (type === BorrowBatch.NAME) {
            return new BorrowBatch(this.client, this.metrics).router(number, request, scratch)
        } else if (type === ReturnBatch.NAME) {
            return new ReturnBatch(this.client, this.metrics).router(number, request, scratch)
        } else if (type === CreateBatch.NAME) {
            return new CreateBatch(this.client, this.metrics).router(number, request, scratch)
        } else if (type === DeleteBatch.NAME) {
            return new DeleteBatch(this.client, this.metrics).router(number, request, scratch)
        } else if (type === CreateReservation.NAME) {
            return new CreateReservation(this.client, this.metrics).router(number, request, scratch)
        } else if (type === DeleteReservation.NAME) {
            return new DeleteReservation(this.client, this.metrics).router(number, request, scratch)
        } else if (type === GetReservation.NAME) {
            return new GetReservation(this.client, this.metrics).router(number, request, scratch)
        } else {
            return this.footer(number, request, scratch)
        }
    }

    private abort(number: string, scratch?: any): string | PromiseLike<string> {
        if (scratch) {
            return this.transactionsTable.delete(number)
                    .then(() => "Request Reset")
        } else {
            return "No Request to Abort."
        }
    }

    private footer(number: string, request: string, scratch?: any): string | PromiseLike<string> {
        if (scratch) {
            return this.transactionsTable.delete(number)
                .then(() => "Request type is invalid. Transaction data is corrupt. Deleting transaction.")
        } else {
            if (request === "help") {
                // Handled by Pinpoint Keywords
                return HELP_MENU
            } else if (request === "help basic") {
                return BASIC_HELP_MENU
            } else if (request === "help advanced") {
                return ADVANCED_HELP_MENU
            } else {
                return "Invalid Request. Please reply with 'help' to get valid operations."
            }
        }
    }
}
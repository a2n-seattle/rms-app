import {
    DeleteCommandInput, DeleteCommandOutput,
    GetCommandInput, GetCommandOutput,
    PutCommandInput, PutCommandOutput,
    UpdateCommandInput, UpdateCommandOutput,
    ScanCommandInput, ScanCommandOutput
} from "@aws-sdk/lib-dynamodb"

/**
 * Database client following pattern of DynamoDB DocumentClient
 *
 * ref: https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Operations_Amazon_DynamoDB.html
 */
export interface DBClient {
    /**
     * Deletes a single item in a table by primary key by delegating to AWS.DynamoDB.deleteItem().
     */
    delete(params: DeleteCommandInput): Promise<DeleteCommandOutput>;
    /**
     * Returns a set of attributes for the item with the given primary key by delegating to AWS.DynamoDB.getItem().
     */
    get(params: GetCommandInput): Promise<GetCommandOutput>;
    /**
     * Creates a new item, or replaces an old item with a new item by delegating to AWS.DynamoDB.putItem().
     */
    put(params: PutCommandInput): Promise<PutCommandOutput>;
    /**
     * Edits an existing item's attributes, or adds a new item to the table if it does not already exist by delegating to AWS.DynamoDB.updateItem().
     */
    update(params: UpdateCommandInput): Promise<UpdateCommandOutput>;
    /**
     * Returns one or more items and item attributes by accessing every item in a table or a secondary index.
     */
    scan(params: ScanCommandInput): Promise<ScanCommandOutput>;
}

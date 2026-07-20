import { DBClient } from "./DBClient"
import { DynamoDBClient, DynamoDBClientConfig } from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient, TranslateConfig,
    DeleteCommand, DeleteCommandInput, DeleteCommandOutput,
    GetCommand, GetCommandInput, GetCommandOutput,
    PutCommand, PutCommandInput, PutCommandOutput,
    UpdateCommand, UpdateCommandInput, UpdateCommandOutput,
    ScanCommand, ScanCommandInput, ScanCommandOutput
} from "@aws-sdk/lib-dynamodb"

export class DDBClient implements DBClient {
    private readonly docClient: DynamoDBDocumentClient

    public constructor(options?: DynamoDBClientConfig, translateConfig?: TranslateConfig) {
        this.docClient = DynamoDBDocumentClient.from(new DynamoDBClient(options ?? {}), translateConfig)
    }

    public delete(params: DeleteCommandInput): Promise<DeleteCommandOutput> {
        return this.docClient.send(new DeleteCommand(params))
    }

    public get(params: GetCommandInput): Promise<GetCommandOutput> {
        return this.docClient.send(new GetCommand(params))
    }

    public put(params: PutCommandInput): Promise<PutCommandOutput> {
        return this.docClient.send(new PutCommand(params))
    }

    public update(params: UpdateCommandInput): Promise<UpdateCommandOutput> {
        return this.docClient.send(new UpdateCommand(params))
    }

    public scan(params: ScanCommandInput): Promise<ScanCommandOutput> {
        return this.docClient.send(new ScanCommand(params))
    }
}

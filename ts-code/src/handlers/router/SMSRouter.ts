import { Router } from "./Router"
import { DBClient } from "../../injection/db/DBClient"
import { DDBClient } from "../../injection/db/DDBClient"
import { CloudWatchClient } from "../../injection/metrics/CloudWatchClient"
import { MetricsClient } from "../../injection/metrics/MetricsClient"
import { SNSEvent, SNSEventRecord, SNSHandler } from "aws-lambda"
import { Pinpoint, SendMessagesCommandInput } from "@aws-sdk/client-pinpoint";

const pinpoint: Pinpoint = new Pinpoint()

/**
 * Main entry handler, which splits up the records to be handled separately.
 */
 export const handler: SNSHandler = async (event: SNSEvent) => {
    await Promise.all(event.Records.map((record: SNSEventRecord) => new SMSRouter(record).processRecord()))
}

class SMSRouter {
    private db: DBClient = new DDBClient()
    private cw: MetricsClient = new CloudWatchClient("Lambda")
    private request: string
    private responseOrigination: string
    private responseDestination: string

    public constructor(record: SNSEventRecord) {
        const message = JSON.parse(record.Sns.Message)
        this.request = message.messageBody
        this.responseOrigination = message.destinationNumber
        this.responseDestination = message.originationNumber
    }

    /**
     * Function to route requests
     */
    public processRecord(): Promise<any> {
        console.log(`Starting request from ${this.responseDestination}`)

        return new Router(this.db, this.cw).processRequest(this.request, this.responseDestination)
            .then(
                (response: string) => this.sendMessage(response),
                (reason: any) => this.sendMessage(reason.toString())
            )
    }

    /**
     * Function to send Pinpoint SMS response.
     */
    private sendMessage(response: string): Promise<any> {
        const params: SendMessagesCommandInput = {
            ApplicationId: process.env.PinpointAppId,
            MessageRequest: {
                Addresses: {
                    [this.responseDestination]: {
                        ChannelType: 'SMS'
                    }
                },
                MessageConfiguration: {
                    SMSMessage: {
                        Body: response,
                        MessageType: 'PROMOTIONAL',
                        OriginationNumber: this.responseOrigination
                    }
                }
            }
        }

        return pinpoint.sendMessages(params)
            .then(
                () => {
                    console.log(`Message sent to ${this.responseDestination}`)
                },
                (reason: any) => {
                    console.error(`Error encountered when attempting to send to ${this.responseDestination}:`)
                    console.error(reason)
                }
            );
    }
}


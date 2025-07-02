import { SQSClient as AWSSQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand, SendMessageBatchCommand, Message } from '@aws-sdk/client-sqs';
import { AWSConfigService } from '../config/aws.config';
import { AWSException } from '../../../domain/exceptions/infrastructure.exception';
import { LoggerService } from '../../logging/logger.service';

export class SQSClient {
  private client: AWSSQSClient;
  private readonly logger = LoggerService.getInstance().getLogger();

  constructor() {
    const config = AWSConfigService.getInstance().getConfig();
    this.client = new AWSSQSClient(config);
  }

  async sendMessage(queueUrl: string, messageBody: string, delaySeconds = 0): Promise<string> {
    try {
      this.logger.debug('Enviando mensaje a SQS', { queueUrl, delaySeconds });
      const command = new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: messageBody,
        DelaySeconds: delaySeconds,
      });
      const response = await this.client.send(command);
      this.logger.info('Mensaje enviado a SQS', { queueUrl, messageId: response.MessageId });
      return response.MessageId || '';
    } catch (error) {
      this.logger.error('Error enviando mensaje a SQS', error as Error, { queueUrl });
      throw AWSException.sqsError('sendMessage', { queueUrl, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async sendBatch(queueUrl: string, messages: string[]): Promise<string[]> {
    try {
      this.logger.debug('Enviando batch de mensajes a SQS', { queueUrl, count: messages.length });
      const entries = messages.map((body, i) => ({
        Id: `msg-${i}`,
        MessageBody: body,
      }));
      const command = new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: entries,
      });
      const response = await this.client.send(command);
      this.logger.info('Batch enviado a SQS', { queueUrl, successful: response.Successful?.length });
      return response.Successful?.map(s => s.MessageId!) || [];
    } catch (error) {
      this.logger.error('Error enviando batch a SQS', error as Error, { queueUrl });
      throw AWSException.sqsError('sendBatch', { queueUrl, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async receiveMessages(queueUrl: string, maxMessages = 1, waitTimeSeconds = 0): Promise<Message[]> {
    try {
      this.logger.debug('Recibiendo mensajes de SQS', { queueUrl, maxMessages, waitTimeSeconds });
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: waitTimeSeconds,
      });
      const response = await this.client.send(command);
      this.logger.info('Mensajes recibidos de SQS', { queueUrl, count: response.Messages?.length || 0 });
      return response.Messages || [];
    } catch (error) {
      this.logger.error('Error recibiendo mensajes de SQS', error as Error, { queueUrl });
      throw AWSException.sqsError('receiveMessages', { queueUrl, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    try {
      this.logger.debug('Eliminando mensaje de SQS', { queueUrl });
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      });
      await this.client.send(command);
      this.logger.info('Mensaje eliminado de SQS', { queueUrl });
    } catch (error) {
      this.logger.error('Error eliminando mensaje de SQS', error as Error, { queueUrl });
      throw AWSException.sqsError('deleteMessage', { queueUrl, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
} 
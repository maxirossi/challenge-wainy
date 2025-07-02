import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName = 'deudores-bcra-bucket';

  constructor() {
    this.s3Client = new S3Client({
      endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
      forcePathStyle: true, // Necesario para LocalStack
    });
  }

  async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      this.logger.log(`Archivo subido exitosamente: ${key}`);
    } catch (error) {
      this.logger.error(`Error subiendo archivo a S3: ${error.message}`);
      throw new Error(`Error subiendo archivo a S3: ${error.message}`);
    }
  }

  async uploadFileStream(
    stream: Readable,
    key: string,
    contentType: string,
  ): Promise<void> {
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: key,
          Body: stream,
          ContentType: contentType,
        },
        queueSize: 4, // Número de partes concurrentes
        partSize: 1024 * 1024 * 5, // 5MB por parte
        leavePartsOnError: false,
      });

      await upload.done();
      this.logger.log(`Archivo grande subido exitosamente: ${key}`);
    } catch (error) {
      this.logger.error(`Error subiendo archivo grande a S3: ${error.message}`);
      throw new Error(`Error subiendo archivo grande a S3: ${error.message}`);
    }
  }
} 
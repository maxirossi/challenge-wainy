import { S3Client as AWSS3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AWSConfigService } from '../config/aws.config';
import { AWSException } from '../../../domain/exceptions/infrastructure.exception';
import { LoggerService } from '../../logging/logger.service';

export interface S3UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  publicRead?: boolean;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
}

export class S3Client {
  private client: AWSS3Client;
  private readonly logger = LoggerService.getInstance().getLogger();

  constructor() {
    const config = AWSConfigService.getInstance().getConfig();
    this.client = new AWSS3Client(config);
  }

  async uploadFile(
    bucket: string,
    key: string,
    data: Buffer | string,
    options: S3UploadOptions = {}
  ): Promise<string> {
    try {
      this.logger.debug('Subiendo archivo a S3', { bucket, key, size: data.length });

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: options.contentType,
        Metadata: options.metadata,
        ACL: options.publicRead ? 'public-read' : undefined,
      });

      await this.client.send(command);
      
      this.logger.info('Archivo subido exitosamente a S3', { bucket, key });
      return `s3://${bucket}/${key}`;
    } catch (error) {
      this.logger.error('Error subiendo archivo a S3', error as Error, { bucket, key });
      throw AWSException.s3Error('upload', { bucket, key, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async downloadFile(bucket: string, key: string): Promise<Buffer> {
    try {
      this.logger.debug('Descargando archivo de S3', { bucket, key });

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        throw new Error('No se pudo obtener el contenido del archivo');
      }

      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      const buffer = Buffer.concat(chunks);
      this.logger.info('Archivo descargado exitosamente de S3', { bucket, key, size: buffer.length });
      
      return buffer;
    } catch (error) {
      this.logger.error('Error descargando archivo de S3', error as Error, { bucket, key });
      throw AWSException.s3Error('download', { bucket, key, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      this.logger.debug('Eliminando archivo de S3', { bucket, key });

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.client.send(command);
      this.logger.info('Archivo eliminado exitosamente de S3', { bucket, key });
    } catch (error) {
      this.logger.error('Error eliminando archivo de S3', error as Error, { bucket, key });
      throw AWSException.s3Error('delete', { bucket, key, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async listFiles(bucket: string, prefix?: string): Promise<S3Object[]> {
    try {
      this.logger.debug('Listando archivos de S3', { bucket, prefix });

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      });

      const response = await this.client.send(command);
      
      const objects: S3Object[] = (response.Contents || []).map(item => ({
        key: item.Key!,
        size: item.Size!,
        lastModified: item.LastModified!,
        etag: item.ETag!,
      }));

      this.logger.info('Archivos listados exitosamente de S3', { bucket, prefix, count: objects.length });
      return objects;
    } catch (error) {
      this.logger.error('Error listando archivos de S3', error as Error, { bucket, prefix });
      throw AWSException.s3Error('list', { bucket, prefix, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async generatePresignedUrl(bucket: string, key: string, expiresIn = 3600): Promise<string> {
    try {
      this.logger.debug('Generando URL presignada de S3', { bucket, key, expiresIn });

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      
      this.logger.info('URL presignada generada exitosamente', { bucket, key, expiresIn });
      return url;
    } catch (error) {
      this.logger.error('Error generando URL presignada de S3', error as Error, { bucket, key });
      throw AWSException.s3Error('generatePresignedUrl', { bucket, key, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  async fileExists(bucket: string, key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
} 
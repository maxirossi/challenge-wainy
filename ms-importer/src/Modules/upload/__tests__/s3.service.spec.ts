import { Test, TestingModule } from '@nestjs/testing';
import { S3Service } from '../s3.service';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/lib-storage');

describe('S3Service', () => {
  let service: S3Service;
  let mockS3Client: jest.Mocked<S3Client>;
  let mockUpload: jest.Mocked<Upload>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock S3Client
    mockS3Client = {
      send: jest.fn(),
    } as unknown as jest.Mocked<S3Client>;

    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(() => mockS3Client);

    // Mock Upload
    mockUpload = {
      done: jest.fn(),
    } as unknown as jest.Mocked<Upload>;

    (Upload as jest.MockedClass<typeof Upload>).mockImplementation(() => mockUpload);

    const module: TestingModule = await Test.createTestingModule({
      providers: [S3Service],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
      // Arrange
      const buffer = Buffer.from('test content');
      const key = 'test-file.txt';
      const contentType = 'text/plain';

      mockS3Client.send.mockResolvedValue({} as never);

      // Act
      await service.uploadFile(buffer, key, contentType);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'deudores-bcra-bucket',
            Key: key,
            Body: buffer,
            ContentType: contentType,
          }),
        })
      );
    });

    it('should throw error when upload fails', async () => {
      // Arrange
      const buffer = Buffer.from('test content');
      const key = 'test-file.txt';
      const contentType = 'text/plain';
      const errorMessage = 'Upload failed';

      mockS3Client.send.mockRejectedValue(new Error(errorMessage) as never);

      // Act & Assert
      await expect(service.uploadFile(buffer, key, contentType)).rejects.toThrow(
        `Error subiendo archivo a S3: ${errorMessage}`
      );
    });

    it('should use default AWS configuration when environment variables are not set', () => {
      // Arrange
      const originalEnv = process.env;
      process.env = {};

      // Act
      const newService = new S3Service();

      // Assert
      expect(S3Client).toHaveBeenCalledWith({
        endpoint: 'http://localhost:4566',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
        forcePathStyle: true,
      });

      // Restore environment
      process.env = originalEnv;
    });

    it('should use environment variables when set', () => {
      // Arrange
      const originalEnv = process.env;
      process.env = {
        AWS_ENDPOINT: 'http://custom-endpoint:4566',
        AWS_REGION: 'us-west-2',
        AWS_ACCESS_KEY_ID: 'custom-key',
        AWS_SECRET_ACCESS_KEY: 'custom-secret',
      };

      // Act
      const newService = new S3Service();

      // Assert
      expect(S3Client).toHaveBeenCalledWith({
        endpoint: 'http://custom-endpoint:4566',
        region: 'us-west-2',
        credentials: {
          accessKeyId: 'custom-key',
          secretAccessKey: 'custom-secret',
        },
        forcePathStyle: true,
      });

      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('uploadFileStream', () => {
    it('should upload a file stream successfully', async () => {
      // Arrange
      const stream = new Readable();
      stream.push('test content');
      stream.push(null);
      const key = 'test-file.txt';
      const contentType = 'text/plain';

      mockUpload.done.mockResolvedValue({} as never);

      // Act
      await service.uploadFileStream(stream, key, contentType);

      // Assert
      expect(Upload).toHaveBeenCalledWith({
        client: mockS3Client,
        params: {
          Bucket: 'deudores-bcra-bucket',
          Key: key,
          Body: stream,
          ContentType: contentType,
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 5,
        leavePartsOnError: false,
      });
      expect(mockUpload.done).toHaveBeenCalled();
    });

    it('should throw error when stream upload fails', async () => {
      // Arrange
      const stream = new Readable();
      stream.push('test content');
      stream.push(null);
      const key = 'test-file.txt';
      const contentType = 'text/plain';
      const errorMessage = 'Stream upload failed';

      mockUpload.done.mockRejectedValue(new Error(errorMessage) as never);

      // Act & Assert
      await expect(service.uploadFileStream(stream, key, contentType)).rejects.toThrow(
        `Error subiendo archivo grande a S3: ${errorMessage}`
      );
    });

    it('should handle large files with multipart upload configuration', async () => {
      // Arrange
      const stream = new Readable();
      stream.push('large file content');
      stream.push(null);
      const key = 'large-file.txt';
      const contentType = 'text/plain';

      mockUpload.done.mockResolvedValue({} as never);

      // Act
      await service.uploadFileStream(stream, key, contentType);

      // Assert
      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          queueSize: 4,
          partSize: 1024 * 1024 * 5, // 5MB
          leavePartsOnError: false,
        })
      );
    });
  });

  describe('S3Client configuration', () => {
    it('should create S3Client with correct configuration', () => {
      // Arrange
      const originalEnv = process.env;
      process.env = {};

      // Act
      const newService = new S3Service();

      // Assert
      expect(S3Client).toHaveBeenCalledWith({
        endpoint: 'http://localhost:4566',
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test',
          secretAccessKey: 'test',
        },
        forcePathStyle: true,
      });

      // Restore environment
      process.env = originalEnv;
    });

    it('should use LocalStack configuration by default', () => {
      // Arrange
      const originalEnv = process.env;
      process.env = {};

      // Act
      const newService = new S3Service();

      // Assert
      expect(S3Client).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: 'http://localhost:4566',
          forcePathStyle: true,
        })
      );

      // Restore environment
      process.env = originalEnv;
    });
  });

  describe('bucket configuration', () => {
    it('should use correct bucket name', async () => {
      // Arrange
      const buffer = Buffer.from('test content');
      const key = 'test-file.txt';
      const contentType = 'text/plain';

      mockS3Client.send.mockResolvedValue({} as never);

      // Act
      await service.uploadFile(buffer, key, contentType);

      // Assert
      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'deudores-bcra-bucket',
          }),
        })
      );
    });
  });
}); 
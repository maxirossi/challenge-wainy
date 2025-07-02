import { Test, TestingModule } from '@nestjs/testing';
import { UploadService, UploadResult } from '../upload.service';
import { S3Service } from '../s3.service';
import { BcraLineParser } from '../bcra-line-parser.service';
import { RegisterDeudorUseCase } from '../../deudores/application/use-cases/register-deudor.usecase';
import { ImportacionRepository } from '../infrastructure/repositories/importacion.repository';
import { DeudorImportadoRepository } from '../infrastructure/repositories/deudor-importado.repository';
import { ErrorImportacionRepository } from '../infrastructure/repositories/error-importacion.repository';
import { Readable } from 'stream';

describe('UploadService', () => {
  let service: UploadService;
  let s3Service: jest.Mocked<S3Service>;
  let bcraLineParser: jest.Mocked<BcraLineParser>;
  let registerDeudorUseCase: jest.Mocked<RegisterDeudorUseCase>;
  let importacionRepository: jest.Mocked<ImportacionRepository>;
  let deudorImportadoRepository: jest.Mocked<DeudorImportadoRepository>;
  let errorImportacionRepository: jest.Mocked<ErrorImportacionRepository>;

  beforeEach(async () => {
    const mockS3Service = {
      uploadFile: jest.fn(),
      uploadFileStream: jest.fn(),
    };

    const mockBcraLineParser = {
      parseLine: jest.fn(),
    };

    const mockRegisterDeudorUseCase = {
      execute: jest.fn(),
    };

    const mockImportacionRepository = {
      crear: jest.fn(),
      actualizarEstadisticas: jest.fn(),
    };

    const mockDeudorImportadoRepository = {
      crear: jest.fn(),
    };

    const mockErrorImportacionRepository = {
      crear: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        {
          provide: S3Service,
          useValue: mockS3Service,
        },
        {
          provide: BcraLineParser,
          useValue: mockBcraLineParser,
        },
        {
          provide: RegisterDeudorUseCase,
          useValue: mockRegisterDeudorUseCase,
        },
        {
          provide: ImportacionRepository,
          useValue: mockImportacionRepository,
        },
        {
          provide: DeudorImportadoRepository,
          useValue: mockDeudorImportadoRepository,
        },
        {
          provide: ErrorImportacionRepository,
          useValue: mockErrorImportacionRepository,
        },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
    s3Service = module.get(S3Service);
    bcraLineParser = module.get(BcraLineParser);
    registerDeudorUseCase = module.get(RegisterDeudorUseCase);
    importacionRepository = module.get(ImportacionRepository);
    deudorImportadoRepository = module.get(DeudorImportadoRepository);
    errorImportacionRepository = module.get(ErrorImportacionRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processFile', () => {
    it('should process a valid file successfully', async () => {
      // Arrange
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('0000720231111200039055280001 1,0         ,0          ,0          ,0          ,0          ,0          1,0         ,0          ,0          ,0          0           0000000\n'),
        size: 12,
      };

      const mockParsedData = {
        codigo_entidad: '00007',
        fecha_informacion: '202311',
        tipo_identificacion: '11',
        numero_identificacion: '200039055280001',
        actividad: '',
        situacion: '',
        prestamos_total_garantias: 1.0,
      };

      const mockImportacion = {
        id: 'import-123',
        nombreArchivo: mockFile.originalname,
        fechaImportacion: '2024-01-01T00:00:00.000Z',
        usuario: undefined,
        s3Key: 'bcra-files/test.txt',
        estado: 'en_proceso' as const,
        cantidadRegistros: 0,
        cantidadErrores: 0,
        contenidoArchivo: '',
        tamanoArchivo: mockFile.size,
        tipoArchivo: mockFile.mimetype,
      };

      s3Service.uploadFileStream.mockResolvedValue();
      importacionRepository.crear.mockResolvedValue(mockImportacion);
      importacionRepository.actualizarEstadisticas.mockResolvedValue();
      registerDeudorUseCase.execute.mockResolvedValue();
      deudorImportadoRepository.crear.mockResolvedValue();
      bcraLineParser.parseLine.mockReturnValue(mockParsedData);

      // Act
      const result = await service.processFile(mockFile);

      // Assert
      expect(result).toEqual({
        message: 'Archivo procesado exitosamente',
        processedLines: 1,
        s3Key: expect.stringContaining('bcra-files/'),
        importacionId: mockImportacion.id,
        cantidadErrores: 0,
        tamanoArchivo: mockFile.size,
        tiempoProcesamiento: expect.any(Number),
      });

      expect(s3Service.uploadFileStream).toHaveBeenCalled();
      expect(importacionRepository.crear).toHaveBeenCalledWith({
        nombreArchivo: mockFile.originalname,
        s3Key: expect.stringContaining('bcra-files/'),
        contenidoArchivo: '',
        tamanoArchivo: mockFile.size,
        tipoArchivo: mockFile.mimetype,
      });
      expect(importacionRepository.actualizarEstadisticas).toHaveBeenCalledWith(
        mockImportacion.id,
        1,
        0,
        'completado',
      );
      expect(registerDeudorUseCase.execute).toHaveBeenCalledWith(
        mockParsedData.numero_identificacion,
        parseInt(mockParsedData.situacion, 10),
        mockParsedData.prestamos_total_garantias,
      );
      expect(deudorImportadoRepository.crear).toHaveBeenCalledWith({
        cuit: mockParsedData.numero_identificacion,
        importacionId: mockImportacion.id,
        codigoEntidad: mockParsedData.codigo_entidad,
        fechaInformacion: mockParsedData.fecha_informacion,
        tipoIdentificacion: mockParsedData.tipo_identificacion,
        numeroIdentificacion: mockParsedData.numero_identificacion,
        actividad: mockParsedData.actividad,
        situacion: parseInt(mockParsedData.situacion, 10),
        prestamosGarantias: mockParsedData.prestamos_total_garantias,
        lineaArchivo: 1,
      });
    });

    it('should handle file with parsing errors', async () => {
      // Arrange
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('invalid line 1\n0000720231111200039055280001 1,0         ,0          ,0          ,0          ,0          ,0          1,0         ,0          ,0          ,0          0           0000000\ninvalid line 2\n'),
        size: 12,
      };

      const mockParsedData = {
        codigo_entidad: '00007',
        fecha_informacion: '202311',
        tipo_identificacion: '11',
        numero_identificacion: '200039055280001',
        actividad: '',
        situacion: '',
        prestamos_total_garantias: 1.0,
      };

      const mockImportacion = {
        id: 'import-123',
        nombreArchivo: mockFile.originalname,
        fechaImportacion: '2024-01-01T00:00:00.000Z',
        usuario: undefined,
        s3Key: 'bcra-files/test.txt',
        estado: 'en_proceso' as const,
        cantidadRegistros: 0,
        cantidadErrores: 0,
        contenidoArchivo: '',
        tamanoArchivo: mockFile.size,
        tipoArchivo: mockFile.mimetype,
      };

      s3Service.uploadFileStream.mockResolvedValue();
      importacionRepository.crear.mockResolvedValue(mockImportacion);
      importacionRepository.actualizarEstadisticas.mockResolvedValue();
      registerDeudorUseCase.execute.mockResolvedValue();
      deudorImportadoRepository.crear.mockResolvedValue();
      errorImportacionRepository.crear.mockResolvedValue();
      bcraLineParser.parseLine
        .mockReturnValueOnce(null) // invalid line 1
        .mockReturnValueOnce(mockParsedData) // valid line
        .mockReturnValueOnce(null); // invalid line 2

      // Act
      const result = await service.processFile(mockFile);

      // Assert
      expect(result).toEqual({
        message: 'Archivo procesado exitosamente',
        processedLines: 1,
        s3Key: expect.stringContaining('bcra-files/'),
        importacionId: mockImportacion.id,
        cantidadErrores: 2,
        tamanoArchivo: mockFile.size,
        tiempoProcesamiento: expect.any(Number),
      });

      expect(importacionRepository.actualizarEstadisticas).toHaveBeenCalledWith(
        mockImportacion.id,
        1,
        2,
        'completado',
      );
      expect(registerDeudorUseCase.execute).toHaveBeenCalledTimes(1);
      expect(deudorImportadoRepository.crear).toHaveBeenCalledTimes(1);
      expect(errorImportacionRepository.crear).toHaveBeenCalledTimes(2);
    });

    it('should handle empty file', async () => {
      // Arrange
      const mockFile = {
        fieldname: 'file',
        originalname: 'empty.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from(''),
        size: 0,
      };

      const mockImportacion = {
        id: 'import-123',
        nombreArchivo: mockFile.originalname,
        fechaImportacion: '2024-01-01T00:00:00.000Z',
        usuario: undefined,
        s3Key: 'bcra-files/empty.txt',
        estado: 'en_proceso' as const,
        cantidadRegistros: 0,
        cantidadErrores: 0,
        contenidoArchivo: '',
        tamanoArchivo: mockFile.size,
        tipoArchivo: mockFile.mimetype,
      };

      s3Service.uploadFileStream.mockResolvedValue();
      importacionRepository.crear.mockResolvedValue(mockImportacion);
      importacionRepository.actualizarEstadisticas.mockResolvedValue();

      // Act
      const result = await service.processFile(mockFile);

      // Assert
      expect(result).toEqual({
        message: 'Archivo procesado exitosamente',
        processedLines: 0,
        s3Key: expect.stringContaining('bcra-files/'),
        importacionId: mockImportacion.id,
        cantidadErrores: 0,
        tamanoArchivo: mockFile.size,
        tiempoProcesamiento: expect.any(Number),
      });

      expect(importacionRepository.actualizarEstadisticas).toHaveBeenCalledWith(
        mockImportacion.id,
        0,
        0,
        'completado',
      );
      expect(registerDeudorUseCase.execute).not.toHaveBeenCalled();
      expect(deudorImportadoRepository.crear).not.toHaveBeenCalled();
      expect(errorImportacionRepository.crear).not.toHaveBeenCalled();
    });

    it('should handle S3 upload failure', async () => {
      // Arrange
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('test content'),
        size: 12,
      };

      const mockImportacion = {
        id: 'import-123',
        nombreArchivo: mockFile.originalname,
        fechaImportacion: '2024-01-01T00:00:00.000Z',
        usuario: undefined,
        s3Key: 'bcra-files/test.txt',
        estado: 'en_proceso' as const,
        cantidadRegistros: 0,
        cantidadErrores: 0,
        contenidoArchivo: '',
        tamanoArchivo: mockFile.size,
        tipoArchivo: mockFile.mimetype,
      };

      s3Service.uploadFileStream.mockRejectedValue(new Error('S3 upload failed'));
      importacionRepository.crear.mockResolvedValue(mockImportacion);
      importacionRepository.actualizarEstadisticas.mockResolvedValue();

      // Act & Assert
      await expect(service.processFile(mockFile)).rejects.toThrow('S3 upload failed');
      expect(importacionRepository.actualizarEstadisticas).toHaveBeenCalledWith(
        mockImportacion.id,
        0,
        0,
        'error',
      );
    });

    it('should handle DynamoDB save deudor failure', async () => {
      // Arrange
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('0000720231111200039055280001 1,0         ,0          ,0          ,0          ,0          ,0          1,0         ,0          ,0          ,0          0           0000000\n'),
        size: 12,
      };

      const mockParsedData = {
        codigo_entidad: '00007',
        fecha_informacion: '202311',
        tipo_identificacion: '11',
        numero_identificacion: '200039055280001',
        actividad: '',
        situacion: '',
        prestamos_total_garantias: 1.0,
      };

      const mockImportacion = {
        id: 'import-123',
        nombreArchivo: mockFile.originalname,
        fechaImportacion: '2024-01-01T00:00:00.000Z',
        usuario: undefined,
        s3Key: 'bcra-files/test.txt',
        estado: 'en_proceso' as const,
        cantidadRegistros: 0,
        cantidadErrores: 0,
        contenidoArchivo: '',
        tamanoArchivo: mockFile.size,
        tipoArchivo: mockFile.mimetype,
      };

      s3Service.uploadFileStream.mockResolvedValue();
      importacionRepository.crear.mockResolvedValue(mockImportacion);
      importacionRepository.actualizarEstadisticas.mockResolvedValue();
      registerDeudorUseCase.execute.mockRejectedValue(new Error('Save deudor failed'));
      bcraLineParser.parseLine.mockReturnValue(mockParsedData);

      // Act & Assert
      await expect(service.processFile(mockFile)).rejects.toThrow('Save deudor failed');
      expect(importacionRepository.actualizarEstadisticas).toHaveBeenCalledWith(
        mockImportacion.id,
        0,
        0,
        'error',
      );
    });

    it('should handle parsing error and save to error repository', async () => {
      // Arrange
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('invalid line\n'),
        size: 12,
      };

      const mockImportacion = {
        id: 'import-123',
        nombreArchivo: mockFile.originalname,
        fechaImportacion: '2024-01-01T00:00:00.000Z',
        usuario: undefined,
        s3Key: 'bcra-files/test.txt',
        estado: 'en_proceso' as const,
        cantidadRegistros: 0,
        cantidadErrores: 0,
        contenidoArchivo: '',
        tamanoArchivo: mockFile.size,
        tipoArchivo: mockFile.mimetype,
      };

      s3Service.uploadFileStream.mockResolvedValue();
      importacionRepository.crear.mockResolvedValue(mockImportacion);
      importacionRepository.actualizarEstadisticas.mockResolvedValue();
      errorImportacionRepository.crear.mockResolvedValue();
      bcraLineParser.parseLine.mockReturnValue(null);

      // Act
      const result = await service.processFile(mockFile);

      // Assert
      expect(result).toEqual({
        message: 'Archivo procesado exitosamente',
        processedLines: 0,
        s3Key: expect.stringContaining('bcra-files/'),
        importacionId: mockImportacion.id,
        cantidadErrores: 1,
        tamanoArchivo: mockFile.size,
        tiempoProcesamiento: expect.any(Number),
      });

      expect(errorImportacionRepository.crear).toHaveBeenCalledWith({
        importacionId: mockImportacion.id,
        linea: 1,
        error: 'Línea no válida o vacía',
        contenidoLinea: 'invalid line',
        tipoError: 'parsing',
      });
    });
  });
}); 
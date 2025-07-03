import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  Header,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiResponse } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @Header('Content-Type', 'application/json')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Subir archivo BCRA',
    description: 'Sube y procesa un archivo .txt del BCRA con información de deudores. Soporta archivos de hasta 10GB con procesamiento por streaming.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo .txt del BCRA (hasta 10GB)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Archivo procesado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        processedLines: { type: 'number' },
        s3Key: { type: 'string' },
        importacionId: { type: 'string' },
        cantidadErrores: { type: 'number' },
        tamanoArchivo: { type: 'number' },
        tiempoProcesamiento: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @ApiResponse({ status: 413, description: 'Archivo demasiado grande' })
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 * 1024 }), // 10GB
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    // Validar tipo de archivo manualmente
    if (file.mimetype !== 'text/plain') {
      throw new BadRequestException('Solo se permiten archivos de texto plano (.txt)');
    }

    return await this.uploadService.processFile(file);
  }
} 
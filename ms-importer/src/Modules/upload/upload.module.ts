import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { S3Service } from './s3.service';
import { BcraLineParser } from './bcra-line-parser.service';
import { ImportacionRepository } from './infrastructure/repositories/importacion.repository';
import { DeudorImportadoRepository } from './infrastructure/repositories/deudor-importado.repository';
import { ErrorImportacionRepository } from './infrastructure/repositories/error-importacion.repository';
import { DeudoresModule } from '../deudores/deudores.module';

@Module({
  imports: [DeudoresModule],
  controllers: [UploadController],
  providers: [
    UploadService,
    S3Service,
    BcraLineParser,
    ImportacionRepository,
    DeudorImportadoRepository,
    ErrorImportacionRepository,
  ],
})
export class UploadModule {} 
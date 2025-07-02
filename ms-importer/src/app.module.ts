import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeudoresModule } from './Modules/deudores/deudores.module';
import { UploadModule } from './Modules/upload/upload.module';

@Module({
  imports: [DeudoresModule, UploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

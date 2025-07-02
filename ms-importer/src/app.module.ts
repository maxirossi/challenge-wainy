import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DeudoresModule } from './deudores/deudores.module';

@Module({
  imports: [DeudoresModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

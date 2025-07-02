import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DebtorsModule } from './debtors/debtors.module';

@Module({
  imports: [DebtorsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

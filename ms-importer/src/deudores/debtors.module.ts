import { Module } from '@nestjs/common';
import { DebtorsController } from './debtors.controller';

@Module({
  controllers: [DebtorsController],
})
export class DebtorsModule {} 
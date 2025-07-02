import { Module } from '@nestjs/common';
import { DeudoresController } from './deudores.controller';

@Module({
  controllers: [DeudoresController],
})
export class DeudoresModule {} 
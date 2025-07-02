import { Module } from '@nestjs/common';

import { DeudoresController } from './deudores.controller';
import { RegisterDeudorUseCase } from './application/use-cases/register-deudor.usecase';
import { GetDeudorUseCase } from './application/use-cases/get-deudor.usecase';
import { InMemoryDeudorRepository } from './infrastructure/repositories/in-memory-deudor.repository';

@Module({
  controllers: [DeudoresController],
  providers: [
    RegisterDeudorUseCase,
    GetDeudorUseCase,
    {
      provide: 'DeudorRepository',
      useClass: InMemoryDeudorRepository,
    },
  ],
  exports: [
    RegisterDeudorUseCase,
    GetDeudorUseCase,
    'DeudorRepository',
  ],
})
export class DeudoresModule {}

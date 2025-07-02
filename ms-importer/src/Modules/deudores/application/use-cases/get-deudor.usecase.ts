import { Inject, Injectable } from '@nestjs/common';
import type { Deudor } from '../../domain/deudor.entity';
import type { DeudorRepository } from '../../domain/deudor.repository';

@Injectable()
export class GetDeudorUseCase {
  constructor(
    @Inject('DeudorRepository')
    private readonly repository: DeudorRepository,
  ) {}

  async execute(cuit: string): Promise<Deudor | null> {
    return await this.repository.findByCuit(cuit);
  }
}

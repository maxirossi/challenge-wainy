import { Inject, Injectable } from '@nestjs/common';
import { Deudor } from '../../domain/deudor.entity';
import type { DeudorRepository } from '../../domain/deudor.repository';

@Injectable()
export class RegisterDeudorUseCase {
  constructor(
    @Inject('DeudorRepository')
    private readonly repository: DeudorRepository,
  ) {}

  async execute(cuit: string, situation: number, monto: number): Promise<void> {
    let deudor = await this.repository.findByCuit(cuit);
    if (!deudor) {
      deudor = new Deudor(cuit, situation, monto);
    } else {
      deudor.updateLoans(situation, monto);
    }

    await this.repository.save(deudor);
  }
}

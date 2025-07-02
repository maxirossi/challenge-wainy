import { Deudor } from '../../domain/deudor.entity';
import { DeudorRepository } from '../../domain/deudor.repository';

export class RegisterDeudorUseCase {
  constructor(private readonly repository: DeudorRepository) {}

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
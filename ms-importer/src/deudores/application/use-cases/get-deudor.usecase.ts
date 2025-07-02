import { Deudor } from '../../domain/deudor.entity';
import { DeudorRepository } from '../../domain/deudor.repository';

export class GetDeudorUseCase {
  constructor(private readonly repository: DeudorRepository) {}

  async execute(cuit: string): Promise<Deudor | null> {
    return await this.repository.findByCuit(cuit);
  }
} 
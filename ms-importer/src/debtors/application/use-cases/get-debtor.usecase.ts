import { Debtor } from '../../domain/debtor.entity';
import { DebtorRepository } from '../../domain/debtor.repository';

export class GetDebtorUseCase {
  constructor(private readonly repository: DebtorRepository) {}

  async execute(cuit: string): Promise<Debtor | null> {
    return await this.repository.findByCuit(cuit);
  }
} 
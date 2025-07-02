import { Debtor } from '../../domain/debtor.entity';
import { DebtorRepository } from '../../domain/debtor.repository';

export class RegisterDebtorUseCase {
  constructor(private readonly repository: DebtorRepository) {}

  async execute(cuit: string, situation: number, amount: number): Promise<void> {
    let debtor = await this.repository.findByCuit(cuit);
    if (!debtor) {
      debtor = new Debtor(cuit, situation, amount);
    } else {
      debtor.updateLoans(situation, amount);
    }

    await this.repository.save(debtor);
  }
} 
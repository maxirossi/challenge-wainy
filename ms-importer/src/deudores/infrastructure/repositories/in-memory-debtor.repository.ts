import { Debtor } from '../../domain/debtor.entity';
import { DebtorRepository } from '../../domain/debtor.repository';

export class InMemoryDebtorRepository implements DebtorRepository {
  private store = new Map<string, Debtor>();

  async save(debtor: Debtor): Promise<void> {
    this.store.set(debtor.cuit, debtor);
  }

  async findByCuit(cuit: string): Promise<Debtor | null> {
    return this.store.get(cuit) || null;
  }
} 
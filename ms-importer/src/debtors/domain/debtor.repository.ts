import { Debtor } from './debtor.entity';

export interface DebtorRepository {
  save(debtor: Debtor): Promise<void>;
  findByCuit(cuit: string): Promise<Debtor | null>;
} 
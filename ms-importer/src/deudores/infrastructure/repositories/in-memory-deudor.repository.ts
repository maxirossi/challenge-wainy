import { Deudor } from '../../domain/deudor.entity';
import { DeudorRepository } from '../../domain/deudor.repository';

export class InMemoryDeudorRepository implements DeudorRepository {
  private store = new Map<string, Deudor>();

  async save(deudor: Deudor): Promise<void> {
    this.store.set(deudor.cuit, deudor);
  }

  async findByCuit(cuit: string): Promise<Deudor | null> {
    return this.store.get(cuit) || null;
  }
} 
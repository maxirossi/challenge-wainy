import { Injectable } from '@nestjs/common';
import type { Deudor } from '../../domain/deudor.entity';
import type { DeudorRepository } from '../../domain/deudor.repository';

@Injectable()
export class InMemoryDeudorRepository implements DeudorRepository {
  private readonly store = new Map<string, Deudor>();

  save(deudor: Deudor): Promise<void> {
    this.store.set(deudor.cuit, deudor);
    return Promise.resolve();
  }

  findByCuit(cuit: string): Promise<Deudor | null> {
    return Promise.resolve(this.store.get(cuit) || null);
  }
}

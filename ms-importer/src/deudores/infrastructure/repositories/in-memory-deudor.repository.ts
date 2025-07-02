import { Deudor } from '../../domain/deudor.entity';
import { DeudorRepository } from '../../domain/deudor.repository';

export class InMemoryDeudorRepository implements DeudorRepository {
  private almacen = new Map<string, Deudor>();

  async guardar(deudor: Deudor): Promise<void> {
    this.almacen.set(deudor.cuit, deudor);
  }

  async buscarPorCuit(cuit: string): Promise<Deudor | null> {
    return this.almacen.get(cuit) || null;
  }
} 
import { Deudor } from '../../domain/deudor.entity';
import { DeudorRepository } from '../../domain/deudor.repository';
import { CuitValueObject } from '../../domain/value-objects';

export class InMemoryDeudorRepository implements DeudorRepository {
  private almacen = new Map<string, Deudor>();

  async guardar(deudor: Deudor): Promise<void> {
    this.almacen.set(deudor.cuit.valor, deudor);
  }

  async buscarPorCuit(cuit: CuitValueObject): Promise<Deudor | null> {
    return this.almacen.get(cuit.valor) || null;
  }
} 
import type { Deudor } from './deudor.entity';

export interface DeudorRepository {
  save(deudor: Deudor): Promise<void>;
  findByCuit(cuit: string): Promise<Deudor | null>;
}

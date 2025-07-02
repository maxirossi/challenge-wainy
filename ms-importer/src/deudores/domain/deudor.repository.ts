import { Deudor } from './deudor.entity';
import { CuitValueObject } from './value-objects';

export interface DeudorRepository {
  guardar(deudor: Deudor): Promise<void>;
  buscarPorCuit(cuit: CuitValueObject): Promise<Deudor | null>;
} 
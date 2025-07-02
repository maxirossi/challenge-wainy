import { Deudor } from './deudor.entity';

export interface DeudorRepository {
  guardar(deudor: Deudor): Promise<void>;
  buscarPorCuit(cuit: string): Promise<Deudor | null>;
} 
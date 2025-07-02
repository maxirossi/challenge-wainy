import { Deudor } from '../../domain/deudor.entity';
import { DeudorRepository } from '../../domain/deudor.repository';

export class ObtenerDeudorUseCase {
  constructor(private readonly repositorio: DeudorRepository) {}

  async ejecutar(cuit: string): Promise<Deudor | null> {
    return await this.repositorio.buscarPorCuit(cuit);
  }
} 
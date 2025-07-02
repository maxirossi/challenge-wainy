import { Deudor } from '../../domain/deudor.entity';
import { DeudorRepository } from '../../domain/deudor.repository';
import { CuitValueObject } from '../../domain/value-objects';

export class ObtenerDeudorUseCase {
  constructor(private readonly repositorio: DeudorRepository) {}

  async ejecutar(cuit: string): Promise<Deudor | null> {
    const cuitVO = new CuitValueObject(cuit);
    return await this.repositorio.buscarPorCuit(cuitVO);
  }
} 
import { Deudor } from '../../domain/deudor.entity';
import { DeudorRepository } from '../../domain/deudor.repository';

export class RegistrarDeudorUseCase {
  constructor(private readonly repositorio: DeudorRepository) {}

  async ejecutar(cuit: string, situacion: number, monto: number): Promise<void> {
    let deudor = await this.repositorio.buscarPorCuit(cuit);
    if (!deudor) {
      deudor = new Deudor(cuit, situacion, monto);
    } else {
      deudor.actualizarPrestamos(situacion, monto);
    }

    await this.repositorio.guardar(deudor);
  }
} 
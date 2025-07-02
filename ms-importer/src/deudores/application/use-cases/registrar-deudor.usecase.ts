import { Deudor } from '../../domain/deudor.entity';
import { DeudorRepository } from '../../domain/deudor.repository';
import { CuitValueObject, SituacionValueObject, MontoValueObject } from '../../domain/value-objects';

export class RegistrarDeudorUseCase {
  constructor(private readonly repositorio: DeudorRepository) {}

  async ejecutar(cuit: string, situacion: number, monto: number): Promise<void> {
    // Crear Value Objects con validaciones
    const cuitVO = new CuitValueObject(cuit);
    const situacionVO = new SituacionValueObject(situacion);
    const montoVO = new MontoValueObject(monto);

    let deudor = await this.repositorio.buscarPorCuit(cuitVO);
    if (!deudor) {
      deudor = new Deudor(cuitVO, situacionVO, montoVO);
    } else {
      deudor.actualizarPrestamos(situacionVO, montoVO);
    }

    await this.repositorio.guardar(deudor);
  }
} 
import { BaseException } from './base.exception';

export class MontoInvalidoException extends BaseException {
  constructor(mensaje: string, detalles?: Record<string, unknown>) {
    super(mensaje, 'MONTO_INVALIDO', detalles);
  }

  static valorVacio(): MontoInvalidoException {
    return new MontoInvalidoException('El monto no puede estar vacío', {
      tipoEsperado: 'número válido',
    });
  }

  static noEsNumero(valor: unknown): MontoInvalidoException {
    return new MontoInvalidoException('El monto debe ser un número válido', {
      valor,
      tipoEsperado: 'número válido',
    });
  }

  static esNegativo(valor: number): MontoInvalidoException {
    return new MontoInvalidoException('El monto no puede ser negativo', {
      valor,
      valorMinimo: 0,
    });
  }

  static excedeLimite(valor: number): MontoInvalidoException {
    return new MontoInvalidoException(
      'El monto excede el límite máximo permitido',
      { valor, limiteMaximo: 999999999999.99 },
    );
  }
}

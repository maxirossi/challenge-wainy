import { BaseException } from './base.exception';

export class SituacionInvalidaException extends BaseException {
  constructor(mensaje: string, detalles?: Record<string, any>) {
    super(mensaje, 'SITUACION_INVALIDA', detalles);
  }

  static valorVacio(): SituacionInvalidaException {
    return new SituacionInvalidaException(
      'La situación no puede estar vacía',
      { tipoEsperado: 'número entero' }
    );
  }

  static noEsEntero(valor: any): SituacionInvalidaException {
    return new SituacionInvalidaException(
      'La situación debe ser un número entero',
      { valor, tipoEsperado: 'número entero' }
    );
  }

  static fueraDeRango(valor: number): SituacionInvalidaException {
    return new SituacionInvalidaException(
      'La situación debe estar entre 0 y 9',
      { valor, rangoMinimo: 0, rangoMaximo: 9 }
    );
  }
} 
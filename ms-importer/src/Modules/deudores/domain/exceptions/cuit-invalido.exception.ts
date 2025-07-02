import { BaseException } from './base.exception';

export class CuitInvalidoException extends BaseException {
  constructor(mensaje: string, detalles?: Record<string, unknown>) {
    super(mensaje, 'CUIT_INVALIDO', detalles);
  }

  static formatoInvalido(cuit: string): CuitInvalidoException {
    return new CuitInvalidoException(
      'El CUIT debe tener exactamente 11 dígitos numéricos',
      { cuit, formatoEsperado: '11 dígitos numéricos' },
    );
  }

  static cuitVacio(): CuitInvalidoException {
    return new CuitInvalidoException('El CUIT no puede estar vacío', {
      formatoEsperado: '11 dígitos numéricos',
    });
  }

  static cuitTodoCeros(): CuitInvalidoException {
    return new CuitInvalidoException('El CUIT no puede ser 00000000000', {
      cuit: '00000000000',
      razon: 'CUIT con todos los dígitos en cero',
    });
  }
}

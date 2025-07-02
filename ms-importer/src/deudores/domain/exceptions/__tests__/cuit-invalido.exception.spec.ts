import { CuitInvalidoException } from '../cuit-invalido.exception';

describe('CuitInvalidoException', () => {
  describe('constructor', () => {
    it('debería crear una excepción con código CUIT_INVALIDO', () => {
      const excepcion = new CuitInvalidoException('Mensaje de prueba');
      
      expect(excepcion.codigo).toBe('CUIT_INVALIDO');
      expect(excepcion.message).toBe('Mensaje de prueba');
      expect(excepcion.name).toBe('CuitInvalidoException');
    });

    it('debería crear una excepción con detalles', () => {
      const detalles = { cuit: '123', formatoEsperado: '11 dígitos' };
      const excepcion = new CuitInvalidoException('Mensaje de prueba', detalles);
      
      expect(excepcion.detalles).toEqual(detalles);
    });
  });

  describe('formatoInvalido', () => {
    it('debería crear excepción para formato inválido', () => {
      const cuit = '123';
      const excepcion = CuitInvalidoException.formatoInvalido(cuit);
      
      expect(excepcion.message).toBe('El CUIT debe tener exactamente 11 dígitos numéricos');
      expect(excepcion.codigo).toBe('CUIT_INVALIDO');
      expect(excepcion.detalles).toEqual({
        cuit: '123',
        formatoEsperado: '11 dígitos numéricos'
      });
    });
  });

  describe('cuitVacio', () => {
    it('debería crear excepción para CUIT vacío', () => {
      const excepcion = CuitInvalidoException.cuitVacio();
      
      expect(excepcion.message).toBe('El CUIT no puede estar vacío');
      expect(excepcion.codigo).toBe('CUIT_INVALIDO');
      expect(excepcion.detalles).toEqual({
        formatoEsperado: '11 dígitos numéricos'
      });
    });
  });

  describe('cuitTodoCeros', () => {
    it('debería crear excepción para CUIT todo ceros', () => {
      const excepcion = CuitInvalidoException.cuitTodoCeros();
      
      expect(excepcion.message).toBe('El CUIT no puede ser 00000000000');
      expect(excepcion.codigo).toBe('CUIT_INVALIDO');
      expect(excepcion.detalles).toEqual({
        cuit: '00000000000',
        razon: 'CUIT con todos los dígitos en cero'
      });
    });
  });

  describe('herencia', () => {
    it('debería ser instancia de BaseException', () => {
      const excepcion = new CuitInvalidoException('Mensaje de prueba');
      
      expect(excepcion).toBeInstanceOf(Error);
      expect(excepcion).toBeInstanceOf(CuitInvalidoException);
    });
  });
}); 
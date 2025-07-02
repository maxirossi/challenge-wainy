import { BaseException } from '../base.exception';

// Clase concreta para testing de BaseException
class TestException extends BaseException {
  constructor(mensaje: string, codigo: string, detalles?: Record<string, any>) {
    super(mensaje, codigo, detalles);
  }
}

describe('BaseException', () => {
  describe('constructor', () => {
    it('debería crear una excepción con mensaje y código', () => {
      const excepcion = new TestException('Mensaje de prueba', 'TEST_ERROR');

      expect(excepcion.message).toBe('Mensaje de prueba');
      expect(excepcion.codigo).toBe('TEST_ERROR');
      expect(excepcion.name).toBe('TestException');
    });

    it('debería crear una excepción con detalles', () => {
      const detalles = { campo: 'valor', numero: 123 };
      const excepcion = new TestException(
        'Mensaje de prueba',
        'TEST_ERROR',
        detalles,
      );

      expect(excepcion.detalles).toEqual(detalles);
    });

    it('debería mantener el stack trace', () => {
      const excepcion = new TestException('Mensaje de prueba', 'TEST_ERROR');

      expect(excepcion.stack).toBeDefined();
      expect(typeof excepcion.stack).toBe('string');
    });
  });

  describe('obtenerInformacion', () => {
    it('debería retornar información estructurada de la excepción', () => {
      const detalles = { campo: 'valor' };
      const excepcion = new TestException(
        'Mensaje de prueba',
        'TEST_ERROR',
        detalles,
      );

      const informacion = excepcion.obtenerInformacion();

      expect(informacion).toEqual({
        nombre: 'TestException',
        mensaje: 'Mensaje de prueba',
        codigo: 'TEST_ERROR',
        detalles: { campo: 'valor' },
      });
    });

    it('debería retornar información sin detalles cuando no se proporcionan', () => {
      const excepcion = new TestException('Mensaje de prueba', 'TEST_ERROR');

      const informacion = excepcion.obtenerInformacion();

      expect(informacion).toEqual({
        nombre: 'TestException',
        mensaje: 'Mensaje de prueba',
        codigo: 'TEST_ERROR',
        detalles: undefined,
      });
    });
  });

  describe('herencia', () => {
    it('debería ser instancia de Error', () => {
      const excepcion = new TestException('Mensaje de prueba', 'TEST_ERROR');

      expect(excepcion).toBeInstanceOf(Error);
      expect(excepcion).toBeInstanceOf(BaseException);
    });
  });
});

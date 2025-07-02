import { SituacionInvalidaException } from '../../exceptions/situacion-invalida.exception';
import { SituacionValueObject } from '../situacion.value-object';

describe('SituacionValueObject', () => {
  describe('constructor', () => {
    it('debería crear una situación válida', () => {
      const situacion = new SituacionValueObject(3);
      expect(situacion.valor).toBe(3);
    });

    it('debería crear una situación normal (0)', () => {
      const situacion = new SituacionValueObject(0);
      expect(situacion.valor).toBe(0);
    });

    it('debería crear una situación crítica (5)', () => {
      const situacion = new SituacionValueObject(5);
      expect(situacion.valor).toBe(5);
    });

    it('debería crear una situación máxima (9)', () => {
      const situacion = new SituacionValueObject(9);
      expect(situacion.valor).toBe(9);
    });

    it('debería lanzar excepción cuando la situación es null', () => {
      expect(() => new SituacionValueObject(null as any)).toThrow(
        SituacionInvalidaException,
      );
      expect(() => new SituacionValueObject(null as any)).toThrow(
        'La situación no puede estar vacía',
      );
    });

    it('debería lanzar excepción cuando la situación es undefined', () => {
      expect(() => new SituacionValueObject(undefined as any)).toThrow(
        SituacionInvalidaException,
      );
      expect(() => new SituacionValueObject(undefined as any)).toThrow(
        'La situación no puede estar vacía',
      );
    });

    it('debería lanzar excepción cuando la situación no es entero', () => {
      expect(() => new SituacionValueObject(3.5)).toThrow(
        SituacionInvalidaException,
      );
      expect(() => new SituacionValueObject(3.5)).toThrow(
        'La situación debe ser un número entero',
      );
    });

    it('debería lanzar excepción cuando la situación es negativa', () => {
      expect(() => new SituacionValueObject(-1)).toThrow(
        SituacionInvalidaException,
      );
      expect(() => new SituacionValueObject(-1)).toThrow(
        'La situación debe estar entre 0 y 9',
      );
    });

    it('debería lanzar excepción cuando la situación es mayor a 9', () => {
      expect(() => new SituacionValueObject(10)).toThrow(
        SituacionInvalidaException,
      );
      expect(() => new SituacionValueObject(10)).toThrow(
        'La situación debe estar entre 0 y 9',
      );
    });

    it('debería lanzar excepción cuando la situación es NaN', () => {
      expect(() => new SituacionValueObject(NaN)).toThrow(
        SituacionInvalidaException,
      );
      expect(() => new SituacionValueObject(NaN)).toThrow(
        'La situación debe ser un número entero',
      );
    });
  });

  describe('obtenerDescripcion', () => {
    it('debería retornar descripción para situación normal', () => {
      const situacion = new SituacionValueObject(0);
      expect(situacion.obtenerDescripcion()).toBe('Normal');
    });

    it('debería retornar descripción para problemas leves', () => {
      const situacion = new SituacionValueObject(1);
      expect(situacion.obtenerDescripcion()).toBe('Con problemas leves');
    });

    it('debería retornar descripción para problemas moderados', () => {
      const situacion = new SituacionValueObject(2);
      expect(situacion.obtenerDescripcion()).toBe('Con problemas moderados');
    });

    it('debería retornar descripción para problemas serios', () => {
      const situacion = new SituacionValueObject(3);
      expect(situacion.obtenerDescripcion()).toBe('Con problemas serios');
    });

    it('debería retornar descripción para problemas muy serios', () => {
      const situacion = new SituacionValueObject(4);
      expect(situacion.obtenerDescripcion()).toBe('Con problemas muy serios');
    });

    it('debería retornar descripción para irrecuperable', () => {
      const situacion = new SituacionValueObject(5);
      expect(situacion.obtenerDescripcion()).toBe('Irrecuperable');
    });

    it('debería retornar descripción para en proceso de recuperación', () => {
      const situacion = new SituacionValueObject(6);
      expect(situacion.obtenerDescripcion()).toBe('En proceso de recuperación');
    });

    it('debería retornar descripción para en mora', () => {
      const situacion = new SituacionValueObject(7);
      expect(situacion.obtenerDescripcion()).toBe('En mora');
    });

    it('debería retornar descripción para en quiebra', () => {
      const situacion = new SituacionValueObject(8);
      expect(situacion.obtenerDescripcion()).toBe('En quiebra');
    });

    it('debería retornar descripción para sin información', () => {
      const situacion = new SituacionValueObject(9);
      expect(situacion.obtenerDescripcion()).toBe('Sin información');
    });
  });

  describe('esCritica', () => {
    it('debería retornar false para situaciones no críticas', () => {
      expect(new SituacionValueObject(0).esCritica()).toBe(false);
      expect(new SituacionValueObject(1).esCritica()).toBe(false);
      expect(new SituacionValueObject(2).esCritica()).toBe(false);
      expect(new SituacionValueObject(3).esCritica()).toBe(false);
      expect(new SituacionValueObject(4).esCritica()).toBe(false);
    });

    it('debería retornar true para situaciones críticas', () => {
      expect(new SituacionValueObject(5).esCritica()).toBe(true);
      expect(new SituacionValueObject(6).esCritica()).toBe(true);
      expect(new SituacionValueObject(7).esCritica()).toBe(true);
      expect(new SituacionValueObject(8).esCritica()).toBe(true);
      expect(new SituacionValueObject(9).esCritica()).toBe(true);
    });
  });

  describe('esNormal', () => {
    it('debería retornar true solo para situación 0', () => {
      expect(new SituacionValueObject(0).esNormal()).toBe(true);
    });

    it('debería retornar false para otras situaciones', () => {
      expect(new SituacionValueObject(1).esNormal()).toBe(false);
      expect(new SituacionValueObject(5).esNormal()).toBe(false);
      expect(new SituacionValueObject(9).esNormal()).toBe(false);
    });
  });

  describe('equals', () => {
    it('debería retornar true para situaciones iguales', () => {
      const situacion1 = new SituacionValueObject(3);
      const situacion2 = new SituacionValueObject(3);
      expect(situacion1.equals(situacion2)).toBe(true);
    });

    it('debería retornar false para situaciones diferentes', () => {
      const situacion1 = new SituacionValueObject(3);
      const situacion2 = new SituacionValueObject(5);
      expect(situacion1.equals(situacion2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('debería retornar el valor como string', () => {
      const situacion = new SituacionValueObject(3);
      expect(situacion.toString()).toBe('3');
    });
  });

  describe('valor', () => {
    it('debería retornar el valor de la situación', () => {
      const situacion = new SituacionValueObject(3);
      expect(situacion.valor).toBe(3);
    });
  });
});

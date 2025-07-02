import { CuitValueObject } from '../cuit.value-object';
import { CuitInvalidoException } from '../../exceptions';

describe('CuitValueObject', () => {
  describe('constructor', () => {
    it('debería crear un CUIT válido', () => {
      const cuit = new CuitValueObject('20123456789');
      expect(cuit.valor).toBe('20123456789');
    });

    it('debería crear un CUIT válido para persona física', () => {
      const cuit = new CuitValueObject('30765432109');
      expect(cuit.valor).toBe('30765432109');
    });

    it('debería lanzar excepción cuando el CUIT está vacío', () => {
      expect(() => new CuitValueObject('')).toThrow(CuitInvalidoException);
      expect(() => new CuitValueObject('')).toThrow('El CUIT no puede estar vacío');
    });

    it('debería lanzar excepción cuando el CUIT tiene espacios en blanco', () => {
      expect(() => new CuitValueObject('   ')).toThrow(CuitInvalidoException);
      expect(() => new CuitValueObject('   ')).toThrow('El CUIT no puede estar vacío');
    });

    it('debería lanzar excepción cuando el CUIT tiene formato inválido', () => {
      expect(() => new CuitValueObject('123')).toThrow(CuitInvalidoException);
      expect(() => new CuitValueObject('123')).toThrow('El CUIT debe tener exactamente 11 dígitos numéricos');
    });

    it('debería lanzar excepción cuando el CUIT tiene letras', () => {
      expect(() => new CuitValueObject('20ABC456789')).toThrow(CuitInvalidoException);
      expect(() => new CuitValueObject('20ABC456789')).toThrow('El CUIT debe tener exactamente 11 dígitos numéricos');
    });

    it('debería lanzar excepción cuando el CUIT tiene más de 11 dígitos', () => {
      expect(() => new CuitValueObject('201234567890')).toThrow(CuitInvalidoException);
      expect(() => new CuitValueObject('201234567890')).toThrow('El CUIT debe tener exactamente 11 dígitos numéricos');
    });

    it('debería lanzar excepción cuando el CUIT es todo ceros', () => {
      expect(() => new CuitValueObject('00000000000')).toThrow(CuitInvalidoException);
      expect(() => new CuitValueObject('00000000000')).toThrow('El CUIT no puede ser 00000000000');
    });
  });

  describe('formatear', () => {
    it('debería formatear el CUIT correctamente', () => {
      const cuit = new CuitValueObject('20123456789');
      expect(cuit.formatear()).toBe('20-12345678-9');
    });

    it('debería formatear el CUIT de persona física correctamente', () => {
      const cuit = new CuitValueObject('30765432109');
      expect(cuit.formatear()).toBe('30-76543210-9');
    });
  });

  describe('obtenerTipoPersona', () => {
    it('debería identificar empresa correctamente', () => {
      const cuit = new CuitValueObject('20123456789');
      expect(cuit.obtenerTipoPersona()).toBe('Empresa');
    });

    it('debería identificar empresa extranjera correctamente', () => {
      const cuit = new CuitValueObject('23123456789');
      expect(cuit.obtenerTipoPersona()).toBe('Empresa extranjera');
    });

    it('debería identificar persona física correctamente', () => {
      const cuit = new CuitValueObject('30765432109');
      expect(cuit.obtenerTipoPersona()).toBe('Persona física');
    });

    it('debería identificar persona física extranjera correctamente', () => {
      const cuit = new CuitValueObject('33765432109');
      expect(cuit.obtenerTipoPersona()).toBe('Persona física extranjera');
    });

    it('debería retornar tipo desconocido para tipos no mapeados', () => {
      const cuit = new CuitValueObject('99123456789');
      expect(cuit.obtenerTipoPersona()).toBe('Tipo desconocido');
    });
  });

  describe('equals', () => {
    it('debería retornar true para CUITs iguales', () => {
      const cuit1 = new CuitValueObject('20123456789');
      const cuit2 = new CuitValueObject('20123456789');
      expect(cuit1.equals(cuit2)).toBe(true);
    });

    it('debería retornar false para CUITs diferentes', () => {
      const cuit1 = new CuitValueObject('20123456789');
      const cuit2 = new CuitValueObject('30765432109');
      expect(cuit1.equals(cuit2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('debería retornar el valor como string', () => {
      const cuit = new CuitValueObject('20123456789');
      expect(cuit.toString()).toBe('20123456789');
    });
  });

  describe('valor', () => {
    it('debería retornar el valor del CUIT', () => {
      const cuit = new CuitValueObject('20123456789');
      expect(cuit.valor).toBe('20123456789');
    });
  });
}); 
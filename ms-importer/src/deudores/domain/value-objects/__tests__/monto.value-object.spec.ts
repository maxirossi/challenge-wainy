import { MontoValueObject } from '../monto.value-object';
import { MontoInvalidoException } from '../../exceptions';

describe('MontoValueObject', () => {
  describe('constructor', () => {
    it('debería crear un monto válido', () => {
      const monto = new MontoValueObject(150000);
      expect(monto.valor).toBe(150000);
    });

    it('debería crear un monto cero', () => {
      const monto = new MontoValueObject(0);
      expect(monto.valor).toBe(0);
    });

    it('debería crear un monto con decimales', () => {
      const monto = new MontoValueObject(150000.50);
      expect(monto.valor).toBe(150000.50);
    });

    it('debería lanzar excepción cuando el monto es null', () => {
      expect(() => new MontoValueObject(null as any)).toThrow(MontoInvalidoException);
      expect(() => new MontoValueObject(null as any)).toThrow('El monto no puede estar vacío');
    });

    it('debería lanzar excepción cuando el monto es undefined', () => {
      expect(() => new MontoValueObject(undefined as any)).toThrow(MontoInvalidoException);
      expect(() => new MontoValueObject(undefined as any)).toThrow('El monto no puede estar vacío');
    });

    it('debería lanzar excepción cuando el monto no es número', () => {
      expect(() => new MontoValueObject('150000' as any)).toThrow(MontoInvalidoException);
      expect(() => new MontoValueObject('150000' as any)).toThrow('El monto debe ser un número válido');
    });

    it('debería lanzar excepción cuando el monto es NaN', () => {
      expect(() => new MontoValueObject(NaN)).toThrow(MontoInvalidoException);
      expect(() => new MontoValueObject(NaN)).toThrow('El monto debe ser un número válido');
    });

    it('debería lanzar excepción cuando el monto es negativo', () => {
      expect(() => new MontoValueObject(-1000)).toThrow(MontoInvalidoException);
      expect(() => new MontoValueObject(-1000)).toThrow('El monto no puede ser negativo');
    });

    it('debería lanzar excepción cuando el monto excede el límite', () => {
      expect(() => new MontoValueObject(1000000000000)).toThrow(MontoInvalidoException);
      expect(() => new MontoValueObject(1000000000000)).toThrow('El monto excede el límite máximo permitido');
    });
  });

  describe('formatearComoMoneda', () => {
    it('debería formatear monto como moneda argentina', () => {
      const monto = new MontoValueObject(150000);
      const formateado = monto.formatearComoMoneda();
      const esperado = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(150000);
      expect(formateado).toBe(esperado);
    });

    it('debería formatear monto con decimales', () => {
      const monto = new MontoValueObject(150000.50);
      const formateado = monto.formatearComoMoneda();
      const esperado = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(150000.50);
      expect(formateado).toBe(esperado);
    });

    it('debería formatear monto cero', () => {
      const monto = new MontoValueObject(0);
      const formateado = monto.formatearComoMoneda();
      const esperado = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(0);
      expect(formateado).toBe(esperado);
    });

    it('debería formatear monto grande', () => {
      const monto = new MontoValueObject(999999999999.99);
      const formateado = monto.formatearComoMoneda();
      const esperado = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(999999999999.99);
      expect(formateado).toBe(esperado);
    });

    it('debería usar el formato correcto de moneda argentina', () => {
      const monto = new MontoValueObject(150000);
      const formateado = monto.formatearComoMoneda();
      const esperado = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(150000);
      expect(formateado).toBe(esperado);
    });

    it('debería generar el formato esperado por Intl.NumberFormat', () => {
      const monto = new MontoValueObject(150000);
      const formateado = monto.formatearComoMoneda();
      const formatoEsperado = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
      }).format(150000);
      expect(formateado).toBe(formatoEsperado);
    });
  });

  describe('sumar', () => {
    it('debería sumar dos montos correctamente', () => {
      const monto1 = new MontoValueObject(100000);
      const monto2 = new MontoValueObject(50000);
      const resultado = monto1.sumar(monto2);
      
      expect(resultado.valor).toBe(150000);
      expect(resultado).toBeInstanceOf(MontoValueObject);
    });

    it('debería sumar monto con decimales', () => {
      const monto1 = new MontoValueObject(100000.25);
      const monto2 = new MontoValueObject(50000.75);
      const resultado = monto1.sumar(monto2);
      
      expect(resultado.valor).toBe(150001);
    });

    it('debería sumar con cero', () => {
      const monto1 = new MontoValueObject(100000);
      const monto2 = new MontoValueObject(0);
      const resultado = monto1.sumar(monto2);
      
      expect(resultado.valor).toBe(100000);
    });
  });

  describe('esSignificativo', () => {
    it('debería retornar false para montos menores a 1 millón', () => {
      expect(new MontoValueObject(999999).esSignificativo()).toBe(false);
      expect(new MontoValueObject(500000).esSignificativo()).toBe(false);
      expect(new MontoValueObject(0).esSignificativo()).toBe(false);
    });

    it('debería retornar true para montos mayores a 1 millón', () => {
      expect(new MontoValueObject(1000001).esSignificativo()).toBe(true);
      expect(new MontoValueObject(5000000).esSignificativo()).toBe(true);
      expect(new MontoValueObject(1000000).esSignificativo()).toBe(false); // Exactamente 1 millón
    });
  });

  describe('obtenerEnMillones', () => {
    it('debería convertir monto a millones', () => {
      expect(new MontoValueObject(1000000).obtenerEnMillones()).toBe(1);
      expect(new MontoValueObject(2500000).obtenerEnMillones()).toBe(2.5);
      expect(new MontoValueObject(500000).obtenerEnMillones()).toBe(0.5);
    });
  });

  describe('esCero', () => {
    it('debería retornar true para monto cero', () => {
      expect(new MontoValueObject(0).esCero()).toBe(true);
    });

    it('debería retornar false para montos diferentes de cero', () => {
      expect(new MontoValueObject(1).esCero()).toBe(false);
      expect(new MontoValueObject(100000).esCero()).toBe(false);
    });
  });

  describe('equals', () => {
    it('debería retornar true para montos iguales', () => {
      const monto1 = new MontoValueObject(150000);
      const monto2 = new MontoValueObject(150000);
      expect(monto1.equals(monto2)).toBe(true);
    });

    it('debería retornar false para montos diferentes', () => {
      const monto1 = new MontoValueObject(150000);
      const monto2 = new MontoValueObject(200000);
      expect(monto1.equals(monto2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('debería retornar el valor como string', () => {
      const monto = new MontoValueObject(150000);
      expect(monto.toString()).toBe('150000');
    });

    it('debería retornar el valor con decimales como string', () => {
      const monto = new MontoValueObject(150000.50);
      expect(monto.toString()).toBe('150000.5');
    });
  });

  describe('valor', () => {
    it('debería retornar el valor del monto', () => {
      const monto = new MontoValueObject(150000);
      expect(monto.valor).toBe(150000);
    });
  });
}); 
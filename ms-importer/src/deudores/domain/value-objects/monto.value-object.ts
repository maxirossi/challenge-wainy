export class MontoValueObject {
  private readonly _valor: number;

  constructor(valor: number) {
    this.validar(valor);
    this._valor = valor;
  }

  private validar(valor: number): void {
    if (valor === null || valor === undefined) {
      throw new Error('El monto no puede estar vacío');
    }

    if (typeof valor !== 'number' || isNaN(valor)) {
      throw new Error('El monto debe ser un número válido');
    }

    if (valor < 0) {
      throw new Error('El monto no puede ser negativo');
    }

    if (valor > 999999999999.99) {
      throw new Error('El monto excede el límite máximo permitido');
    }
  }

  get valor(): number {
    return this._valor;
  }

  toString(): string {
    return this._valor.toString();
  }

  equals(otro: MontoValueObject): boolean {
    return this._valor === otro._valor;
  }

  // Método para formatear el monto como moneda
  formatearComoMoneda(): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(this._valor);
  }

  // Método para sumar montos
  sumar(otro: MontoValueObject): MontoValueObject {
    return new MontoValueObject(this._valor + otro._valor);
  }

  // Método para verificar si el monto es significativo
  esSignificativo(): boolean {
    return this._valor > 1000000; // Más de 1 millón
  }

  // Método para obtener el monto en millones
  obtenerEnMillones(): number {
    return this._valor / 1000000;
  }

  // Método para verificar si el monto es cero
  esCero(): boolean {
    return this._valor === 0;
  }
} 
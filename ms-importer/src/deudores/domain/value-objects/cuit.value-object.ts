export class CuitValueObject {
  private readonly _valor: string;

  constructor(valor: string) {
    this.validar(valor);
    this._valor = valor;
  }

  private validar(valor: string): void {
    if (!valor || valor.trim().length === 0) {
      throw new Error('El CUIT no puede estar vacío');
    }

    if (!/^\d{11}$/.test(valor)) {
      throw new Error('El CUIT debe tener exactamente 11 dígitos numéricos');
    }

    // Validación adicional: verificar que no sea todo ceros
    if (valor === '00000000000') {
      throw new Error('El CUIT no puede ser 00000000000');
    }
  }

  get valor(): string {
    return this._valor;
  }

  toString(): string {
    return this._valor;
  }

  equals(otro: CuitValueObject): boolean {
    return this._valor === otro._valor;
  }

  // Método para formatear el CUIT con guiones (XX-XXXXXXXX-X)
  formatear(): string {
    return `${this._valor.slice(0, 2)}-${this._valor.slice(2, 10)}-${this._valor.slice(10)}`;
  }

  // Método para obtener el tipo de persona (20: empresa, 23: empresa extranjera, 24: empresa, 27: empresa, 30: persona física, 33: persona física extranjera, 34: persona física)
  obtenerTipoPersona(): string {
    const tipo = this._valor.slice(0, 2);
    const tipos = {
      '20': 'Empresa',
      '23': 'Empresa extranjera',
      '24': 'Empresa',
      '27': 'Empresa',
      '30': 'Persona física',
      '33': 'Persona física extranjera',
      '34': 'Persona física',
    };
    return tipos[tipo] || 'Tipo desconocido';
  }
} 
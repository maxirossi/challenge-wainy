export class SituacionValueObject {
  private readonly _valor: number;

  constructor(valor: number) {
    this.validar(valor);
    this._valor = valor;
  }

  private validar(valor: number): void {
    if (valor === null || valor === undefined) {
      throw new Error('La situación no puede estar vacía');
    }

    if (!Number.isInteger(valor)) {
      throw new Error('La situación debe ser un número entero');
    }

    if (valor < 0 || valor > 9) {
      throw new Error('La situación debe estar entre 0 y 9');
    }
  }

  get valor(): number {
    return this._valor;
  }

  toString(): string {
    return this._valor.toString();
  }

  equals(otro: SituacionValueObject): boolean {
    return this._valor === otro._valor;
  }

  // Método para obtener la descripción de la situación
  obtenerDescripcion(): string {
    const descripciones = {
      0: 'Normal',
      1: 'Con problemas leves',
      2: 'Con problemas moderados',
      3: 'Con problemas serios',
      4: 'Con problemas muy serios',
      5: 'Irrecuperable',
      6: 'En proceso de recuperación',
      7: 'En mora',
      8: 'En quiebra',
      9: 'Sin información',
    };
    return descripciones[this._valor] || 'Situación desconocida';
  }

  // Método para verificar si la situación es crítica
  esCritica(): boolean {
    return this._valor >= 5;
  }

  // Método para verificar si la situación es normal
  esNormal(): boolean {
    return this._valor === 0;
  }
} 
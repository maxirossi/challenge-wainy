export class Deudor {
  constructor(
    public readonly cuit: string,
    public situacionMaxima: number,
    public sumaTotalPrestamos: number,
  ) {
    if (!/^\d{11}$/.test(cuit)) throw new Error('Formato de CUIT inválido');
  }

  actualizarPrestamos(situacion: number, monto: number): void {
    this.situacionMaxima = Math.max(this.situacionMaxima, situacion);
    this.sumaTotalPrestamos += monto;
  }
} 
import { CuitValueObject, SituacionValueObject, MontoValueObject } from './value-objects';

export class Deudor {
  constructor(
    public readonly cuit: CuitValueObject,
    public situacionMaxima: SituacionValueObject,
    public sumaTotalPrestamos: MontoValueObject,
  ) {}

  actualizarPrestamos(situacion: SituacionValueObject, monto: MontoValueObject): void {
    // Actualizar situación máxima (mantener la más alta)
    const nuevaSituacionMaxima = situacion.valor > this.situacionMaxima.valor 
      ? situacion 
      : this.situacionMaxima;
    
    this.situacionMaxima = nuevaSituacionMaxima;
    
    // Sumar al total de préstamos
    this.sumaTotalPrestamos = this.sumaTotalPrestamos.sumar(monto);
  }

  // Método para obtener información resumida del deudor
  obtenerResumen(): {
    cuit: string;
    tipoPersona: string;
    situacionMaxima: number;
    descripcionSituacion: string;
    sumaTotalPrestamos: number;
    montoFormateado: string;
    esSituacionCritica: boolean;
    esMontoSignificativo: boolean;
  } {
    return {
      cuit: this.cuit.valor,
      tipoPersona: this.cuit.obtenerTipoPersona(),
      situacionMaxima: this.situacionMaxima.valor,
      descripcionSituacion: this.situacionMaxima.obtenerDescripcion(),
      sumaTotalPrestamos: this.sumaTotalPrestamos.valor,
      montoFormateado: this.sumaTotalPrestamos.formatearComoMoneda(),
      esSituacionCritica: this.situacionMaxima.esCritica(),
      esMontoSignificativo: this.sumaTotalPrestamos.esSignificativo(),
    };
  }

  // Método para verificar si el deudor está en situación crítica
  estaEnSituacionCritica(): boolean {
    return this.situacionMaxima.esCritica();
  }

  // Método para verificar si el deudor tiene préstamos significativos
  tienePrestamosSignificativos(): boolean {
    return this.sumaTotalPrestamos.esSignificativo();
  }

  // Método para obtener el CUIT formateado
  obtenerCuitFormateado(): string {
    return this.cuit.formatear();
  }
} 
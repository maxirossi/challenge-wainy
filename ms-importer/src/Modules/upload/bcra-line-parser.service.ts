import { Injectable, Logger } from '@nestjs/common';

export interface BcraLineData {
  codigo_entidad: string;
  fecha_informacion: string;
  tipo_identificacion: string;
  numero_identificacion: string;
  actividad: string;
  situacion: string;
  prestamos_total_garantias: number;
}

@Injectable()
export class BcraLineParser {
  private readonly logger = new Logger(BcraLineParser.name);

  parseLine(line: string): BcraLineData | null {
    if (!line || line.trim().length === 0) {
      return null;
    }

    try {
      // Validar longitud mínima de la línea
      if (line.length < 30) {
        throw new Error(`Línea demasiado corta: ${line.length} caracteres (mínimo 30)`);
      }

      // Analizar la primera parte de la línea (antes del primer espacio)
      const firstPart = line.split(' ')[0];
      this.logger.debug(`First part: '${firstPart}' from line: '${line.substring(0, 50)}...'`);
      
      if (firstPart.length < 24) {
        throw new Error(`Primera parte demasiado corta: ${firstPart.length} caracteres`);
      }

      const data: BcraLineData = {
        codigo_entidad: firstPart.substring(0, 5).trim(),
        fecha_informacion: firstPart.substring(5, 11).trim(),
        tipo_identificacion: firstPart.substring(11, 13).trim(),
        numero_identificacion: firstPart.substring(13, 24).trim(),
        actividad: firstPart.substring(24, 27) || '000',
        situacion: firstPart.substring(27, 29) || '00',
        prestamos_total_garantias: this.parsePrestamosGarantiasFromLine(line),
      };

      // Validaciones básicas pero flexibles
      if (!data.codigo_entidad || data.codigo_entidad.trim().length === 0) {
        throw new Error('Código de entidad vacío');
      }

      if (!data.numero_identificacion || data.numero_identificacion.trim().length === 0) {
        throw new Error('Número de identificación vacío');
      }

      return data;
    } catch (error) {
      this.logger.warn(`Error parseando línea: ${error.message}`);
      this.logger.debug(`Línea problemática: ${line.substring(0, 100)}...`);
      return null;
    }
  }

  private parsePrestamosGarantiasFromLine(line: string): number {
    try {
      // Buscar el primer valor numérico después del primer espacio
      const parts = line.split(' ');
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].replace(',', '').replace('.', '');
        const numValue = parseFloat(part);
        if (!isNaN(numValue) && numValue > 0) {
          return numValue;
        }
      }
      return 0;
    } catch (error) {
      this.logger.warn(`Error parseando préstamos/garantías: ${error.message}`);
      return 0;
    }
  }

  private validateNumericField(value: string, fieldName: string): void {
    if (!/^\d+$/.test(value)) {
      throw new Error(`Campo ${fieldName} debe ser numérico: ${value}`);
    }
  }
} 
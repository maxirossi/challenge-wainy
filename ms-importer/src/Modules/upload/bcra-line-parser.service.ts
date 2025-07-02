import { Injectable, Logger } from '@nestjs/common';

export interface BcraLineData {
  codigoEntidad: string;
  fechaInformacion: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  actividad: string;
  situacion: number;
  prestamosGarantias: number;
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
      if (line.length < 41) {
        throw new Error(`Línea demasiado corta: ${line.length} caracteres`);
      }

      const data: BcraLineData = {
        codigoEntidad: line.substring(0, 5).trim(),
        fechaInformacion: line.substring(5, 11).trim(),
        tipoIdentificacion: line.substring(11, 13).trim(),
        numeroIdentificacion: line.substring(13, 24).trim(),
        actividad: line.substring(24, 27).trim(),
        situacion: parseInt(line.substring(27, 29), 10),
        prestamosGarantias: parseInt(line.substring(29, 41), 10),
      };

      // Validaciones básicas
      if (isNaN(data.situacion)) {
        throw new Error(`Situación inválida: ${line.substring(27, 29)}`);
      }

      if (isNaN(data.prestamosGarantias)) {
        throw new Error(`Préstamos/Garantías inválido: ${line.substring(29, 41)}`);
      }

      // Validar que el número de identificación no esté vacío
      if (!data.numeroIdentificacion || data.numeroIdentificacion.trim().length === 0) {
        throw new Error('Número de identificación vacío');
      }

      return data;
    } catch (error) {
      this.logger.warn(`Error parseando línea: ${error.message}`);
      this.logger.debug(`Línea problemática: ${line}`);
      return null;
    }
  }
} 
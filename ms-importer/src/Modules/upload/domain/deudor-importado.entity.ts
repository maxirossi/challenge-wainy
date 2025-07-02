export interface DeudorImportado {
  cuit: string;
  importacionId: string;
  codigoEntidad: string;
  fechaInformacion: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  actividad: string;
  situacion: number;
  prestamosGarantias: number;
  fechaImportacion: string;
  lineaArchivo: number;
}

export interface CrearDeudorImportadoDto {
  cuit: string;
  importacionId: string;
  codigoEntidad: string;
  fechaInformacion: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  actividad: string;
  situacion: number;
  prestamosGarantias: number;
  lineaArchivo: number;
} 
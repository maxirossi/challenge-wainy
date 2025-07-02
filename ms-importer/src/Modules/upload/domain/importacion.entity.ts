export interface Importacion {
  id: string;
  nombreArchivo: string;
  fechaImportacion: string;
  usuario?: string;
  s3Key?: string;
  estado: 'en_proceso' | 'completado' | 'error';
  cantidadRegistros: number;
  cantidadErrores: number;
  contenidoArchivo: string;
  tamanoArchivo: number;
  tipoArchivo: string;
}

export interface CrearImportacionDto {
  nombreArchivo: string;
  usuario?: string;
  s3Key?: string;
  contenidoArchivo: string;
  tamanoArchivo: number;
  tipoArchivo: string;
} 
export interface ErrorImportacion {
  id: string;
  importacionId: string;
  linea: number;
  error: string;
  contenidoLinea?: string;
  timestamp: string;
  tipoError: 'parsing' | 'validacion' | 'persistencia' | 'otro';
}

export interface CrearErrorImportacionDto {
  importacionId: string;
  linea: number;
  error: string;
  contenidoLinea?: string;
  tipoError: 'parsing' | 'validacion' | 'persistencia' | 'otro';
} 
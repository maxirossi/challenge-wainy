export abstract class BaseException extends Error {
  constructor(
    message: string,
    public readonly codigo: string,
    public readonly detalles?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Mantener el stack trace para debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Método para obtener información estructurada del error
  obtenerInformacion(): {
    nombre: string;
    mensaje: string;
    codigo: string;
    detalles?: Record<string, any>;
  } {
    return {
      nombre: this.name,
      mensaje: this.message,
      codigo: this.codigo,
      detalles: this.detalles,
    };
  }
} 
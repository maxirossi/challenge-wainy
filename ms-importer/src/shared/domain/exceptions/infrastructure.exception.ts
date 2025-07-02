import { BaseException } from './base.exception';

export class DatabaseException extends BaseException {
  constructor(message: string, detalles?: Record<string, unknown>) {
    super(message, 'DATABASE_ERROR', detalles, 500);
  }

  static connectionError(
    detalles?: Record<string, unknown>,
  ): DatabaseException {
    return new DatabaseException(
      'Error de conexión a la base de datos',
      detalles,
    );
  }

  static queryError(
    query: string,
    detalles?: Record<string, unknown>,
  ): DatabaseException {
    return new DatabaseException('Error en consulta a la base de datos', {
      query,
      ...detalles,
    });
  }
}

export class AWSException extends BaseException {
  constructor(message: string, detalles?: Record<string, unknown>) {
    super(message, 'AWS_ERROR', detalles, 500);
  }

  static s3Error(
    operation: string,
    detalles?: Record<string, unknown>,
  ): AWSException {
    return new AWSException(`Error en operación S3: ${operation}`, detalles);
  }

  static dynamoDBError(
    operation: string,
    detalles?: Record<string, unknown>,
  ): AWSException {
    return new AWSException(
      `Error en operación DynamoDB: ${operation}`,
      detalles,
    );
  }

  static sqsError(
    operation: string,
    detalles?: Record<string, unknown>,
  ): AWSException {
    return new AWSException(`Error en operación SQS: ${operation}`, detalles);
  }
}

export class ValidationException extends BaseException {
  constructor(message: string, detalles?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', detalles, 400);
  }

  static invalidInput(
    field: string,
    value: unknown,
    detalles?: Record<string, unknown>,
  ): ValidationException {
    return new ValidationException(`Campo inválido: ${field}`, {
      field,
      value,
      ...detalles,
    });
  }
}

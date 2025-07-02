interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
}

export class BaseResponseDto<T = unknown> {
  constructor(
    public readonly success: boolean,
    public readonly data?: T,
    public readonly message?: string,
    public readonly timestamp: Date = new Date(),
  ) {}

  static success<T>(data: T, message?: string): BaseResponseDto<T> {
    return new BaseResponseDto(true, data, message);
  }

  static error(message: string): BaseResponseDto {
    return new BaseResponseDto(false, undefined, message);
  }
}

export class PaginatedResponseDto<T> extends BaseResponseDto<T[]> {
  constructor(
    success: boolean,
    data: T[],
    public readonly pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    },
    message?: string,
    timestamp: Date = new Date(),
  ) {
    super(success, data, message, timestamp);
  }

  static create<T>(
    data: T[],
    config: PaginationConfig,
    message?: string,
  ): PaginatedResponseDto<T> {
    const totalPages = Math.ceil(config.total / config.limit);
    return new PaginatedResponseDto(
      true,
      data,
      {
        page: config.page,
        limit: config.limit,
        total: config.total,
        totalPages,
      },
      message,
    );
  }
}

export class ErrorResponseDto extends BaseResponseDto {
  constructor(
    public readonly error: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    },
    timestamp: Date = new Date(),
  ) {
    super(false, undefined, error.message, timestamp);
  }

  static fromException(
    exception: Error & { codigo?: string; detalles?: Record<string, unknown> },
  ): ErrorResponseDto {
    return new ErrorResponseDto({
      code: exception.codigo || 'UNKNOWN_ERROR',
      message: exception.message,
      details: exception.detalles,
    });
  }
}

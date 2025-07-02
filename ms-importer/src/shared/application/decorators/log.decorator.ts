import { LoggerService } from '../../infrastructure/logging/logger.service';

type MethodDescriptor = PropertyDescriptor & {
  value: (...args: unknown[]) => Promise<unknown>;
};

export function LogMethod() {
  return function (
    target: { constructor: { name: string } },
    propertyKey: string,
    descriptor: MethodDescriptor,
  ) {
    const originalMethod = descriptor.value as Function;

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      const startTime = Date.now();
      const logger = LoggerService.getInstance().getLogger();

      try {
        logger.debug(`Iniciando método: ${propertyKey}`, {
          className: target.constructor.name,
          args: args.length > 0 ? args : undefined,
        });

        const result = (await originalMethod.apply(this, args)) as unknown;
        const executionTime = Date.now() - startTime;

        logger.debug(`Método completado: ${propertyKey}`, {
          className: target.constructor.name,
          executionTime: `${executionTime}ms`,
        });

        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;
        logger.error(`Error en método: ${propertyKey}`, error as Error, {
          className: target.constructor.name,
          executionTime: `${executionTime}ms`,
          args: args.length > 0 ? args : undefined,
        });
        throw error;
      }
    };

    return descriptor;
  };
}

export function LogError() {
  return function (
    target: { constructor: { name: string } },
    propertyKey: string,
    descriptor: MethodDescriptor,
  ) {
    const originalMethod = descriptor.value as Function;

    descriptor.value = async function (
      this: unknown,
      ...args: unknown[]
    ): Promise<unknown> {
      try {
        return (await originalMethod.apply(this, args)) as unknown;
      } catch (error) {
        const logger = LoggerService.getInstance().getLogger();
        logger.error(`Error en método: ${propertyKey}`, error as Error, {
          className: target.constructor.name,
          args: args.length > 0 ? args : undefined,
        });
        throw error;
      }
    };

    return descriptor;
  };
}

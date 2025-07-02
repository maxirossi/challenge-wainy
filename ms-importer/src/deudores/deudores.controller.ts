import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { RegistrarDeudorUseCase } from './application/use-cases/registrar-deudor.usecase';
import { ObtenerDeudorUseCase } from './application/use-cases/obtener-deudor.usecase';
import { InMemoryDeudorRepository } from './infrastructure/repositories/in-memory-deudor.repository';
import { RegistrarDeudorDto } from './dto/registrar-deudor.dto';

@Controller('deudores')
export class DeudoresController {
  private readonly registrarUseCase = new RegistrarDeudorUseCase(new InMemoryDeudorRepository());
  private readonly obtenerUseCase = new ObtenerDeudorUseCase(new InMemoryDeudorRepository());

  @Post()
  async registrar(@Body() body: RegistrarDeudorDto): Promise<{ ok: boolean }> {
    try {
      await this.registrarUseCase.ejecutar(body.cuit, body.situacion, body.monto);
      return { ok: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error al registrar deudor',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':cuit')
  async obtenerPorCuit(@Param('cuit') cuit: string) {
    try {
      const deudor = await this.obtenerUseCase.ejecutar(cuit);
      if (!deudor) {
        throw new HttpException('Deudor no encontrado', HttpStatus.NOT_FOUND);
      }
      return {
        cuit: deudor.cuit,
        situacionMaxima: deudor.situacionMaxima,
        sumaTotalPrestamos: deudor.sumaTotalPrestamos,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error al obtener deudor',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
} 
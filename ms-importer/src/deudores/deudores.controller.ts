import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

import { GetDeudorUseCase } from './application/use-cases/get-deudor.usecase';
import { RegisterDeudorUseCase } from './application/use-cases/register-deudor.usecase';
import { RegisterDeudorDto } from './dto/register-deudor.dto';
import { InMemoryDeudorRepository } from './infrastructure/repositories/in-memory-deudor.repository';

@ApiTags('Deudores')
@Controller('deudores')
export class DeudoresController {
  private readonly registerUseCase = new RegisterDeudorUseCase(
    new InMemoryDeudorRepository(),
  );
  private readonly getUseCase = new GetDeudorUseCase(
    new InMemoryDeudorRepository(),
  );

  @Post()
  @ApiOperation({ summary: 'Registrar deudor', description: 'Registra un nuevo deudor en el sistema.' })
  @ApiBody({ type: RegisterDeudorDto })
  @ApiResponse({ status: 201, description: 'Deudor registrado', schema: { example: { ok: true } } })
  @ApiResponse({ status: 400, description: 'Error de validación o negocio' })
  async register(@Body() body: RegisterDeudorDto): Promise<{ ok: boolean }> {
    try {
      await this.registerUseCase.execute(body.cuit, body.situation, body.monto);
      return { ok: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error registering deudor';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':cuit')
  @ApiOperation({ summary: 'Obtener deudor por CUIT', description: 'Devuelve los datos de un deudor por su CUIT.' })
  @ApiParam({ name: 'cuit', description: 'CUIT del deudor', example: '20123456789' })
  @ApiResponse({ status: 200, description: 'Deudor encontrado', schema: { example: {
    cuit: '20123456789',
    maxSituation: 3,
    totalLoans: 150000.5,
    formattedTotalLoans: '$150.000,50'
  } } })
  @ApiResponse({ status: 404, description: 'Deudor no encontrado' })
  @ApiResponse({ status: 400, description: 'Error de validación o negocio' })
  async getByCuit(@Param('cuit') cuit: string) {
    try {
      const deudor = await this.getUseCase.execute(cuit);
      if (!deudor) {
        throw new HttpException('Deudor not found', HttpStatus.NOT_FOUND);
      }

      return {
        cuit: deudor.cuit,
        maxSituation: deudor.maxSituation,
        totalLoans: deudor.totalLoans,
        formattedTotalLoans: deudor.formattedTotalLoans,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error retrieving deudor';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }
}

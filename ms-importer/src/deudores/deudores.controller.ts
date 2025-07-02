import { RegisterDeudorUseCase } from './application/use-cases/register-deudor.usecase';
import { GetDeudorUseCase } from './application/use-cases/get-deudor.usecase';
import { InMemoryDeudorRepository } from './infrastructure/repositories/in-memory-deudor.repository';
import { RegisterDeudorDto } from './dto/register-deudor.dto';
import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';

@Controller('deudores')
export class DeudoresController {
  private readonly registerUseCase = new RegisterDeudorUseCase(new InMemoryDeudorRepository());
  private readonly getUseCase = new GetDeudorUseCase(new InMemoryDeudorRepository());

  @Post()
  async register(@Body() body: RegisterDeudorDto): Promise<{ ok: boolean }> {
    try {
      await this.registerUseCase.execute(body.cuit, body.situation, body.monto);
      return { ok: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error registering deudor',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':cuit')
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
      throw new HttpException(
        error.message || 'Error retrieving deudor',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
} 
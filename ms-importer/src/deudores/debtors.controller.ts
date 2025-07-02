import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { RegisterDebtorUseCase } from './application/use-cases/register-debtor.usecase';
import { GetDebtorUseCase } from './application/use-cases/get-debtor.usecase';
import { InMemoryDebtorRepository } from './infrastructure/repositories/in-memory-debtor.repository';
import { RegisterDebtorDto } from './dto/register-debtor.dto';

@Controller('debtors')
export class DebtorsController {
  private readonly registerUseCase = new RegisterDebtorUseCase(new InMemoryDebtorRepository());
  private readonly getUseCase = new GetDebtorUseCase(new InMemoryDebtorRepository());

  @Post()
  async register(@Body() body: RegisterDebtorDto): Promise<{ ok: boolean }> {
    try {
      await this.registerUseCase.execute(body.cuit, body.situation, body.amount);
      return { ok: true };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error registering debtor',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':cuit')
  async getByCuit(@Param('cuit') cuit: string) {
    try {
      const debtor = await this.getUseCase.execute(cuit);
      if (!debtor) {
        throw new HttpException('Debtor not found', HttpStatus.NOT_FOUND);
      }
      return {
        cuit: debtor.cuit,
        maxSituation: debtor.maxSituation,
        totalLoans: debtor.totalLoans,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error retrieving debtor',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
} 
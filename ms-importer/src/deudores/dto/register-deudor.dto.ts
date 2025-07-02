import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeudorDto {
  @ApiProperty({ example: '20123456789', description: 'CUIT del deudor' })
  cuit: string;

  @ApiProperty({ example: 3, description: 'Situación crediticia (0-9)' })
  situation: number;

  @ApiProperty({ example: 150000.5, description: 'Monto total de deuda' })
  monto: number;
}

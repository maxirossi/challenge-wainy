import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Ping de salud', description: 'Devuelve un mensaje de bienvenida.' })
  @ApiResponse({ status: 200, description: 'OK', type: String })
  getHello(): string {
    return this.appService.getHello();
  }
}

import { Controller, Post, Body } from '@nestjs/common';
import { CostService } from './cost.service';
import { costCalcDTO } from './types';
import { ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('cost')
export class CostController {
  constructor(private readonly costService: CostService) {}
  @ApiOperation({
    summary: 'Calculate cost',
    description: 'If you want to know price of car usage in date range',
  })
  @Post()
  async calculate(@Body() dto: costCalcDTO) {
    return await this.costService.calculate(dto);
  }
}

import { Controller, Get, Query, Response } from '@nestjs/common';
import { CostService } from './cost.service';
import { costCalcDTO } from './types';
import { ApiOperation } from '@nestjs/swagger';

@Controller('cost')
export class CostController {
  constructor(private readonly costService: CostService) {}

  @ApiOperation({
    summary: 'Calculate cost',
    description: 'If you want to know price of car usage in date range',
  })
  @Get()
  async calculate(@Query() dto: costCalcDTO, @Response() res) {
    const result = await this.costService.calculate(dto);
    if (typeof result === 'number') {
      res.status(200);
    } else {
      res.status(409);
    }
    res.send(result);
  }
}

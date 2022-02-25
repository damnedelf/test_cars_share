import { Controller, Get, Body, Query } from '@nestjs/common';
import { StatsService } from './stats.service';
import { statsDTO } from './types';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  find(@Query() query: statsDTO) {
    return this.statsService.carsStats(query);
  }
}

import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { PgService } from '../pg/pg.service';
import { ConfigService } from '@nestjs/config';
import { SessionService } from '../session/session.service';
import { CalculationService } from '../calculation/calculation.service';
import { CarService } from '../car/car.service';
import { RateService } from '../rate/rate.service';
import { DiscountService } from '../discount/discount.service';
import { ValidationService } from '../validation/validation.service';

@Module({
  providers: [
    CarService,
    RateService,
    DiscountService,
    ValidationService,
    StatsService,
    PgService,
    ConfigService,
    SessionService,
    CalculationService,
  ],
  controllers: [StatsController],
})
export class StatsModule {}

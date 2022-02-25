import { Module } from '@nestjs/common';
import { CostController } from './cost.controller';
import { CostService } from './cost.service';
import { SessionService } from '../session/session.service';
import { PgService } from '../pg/pg.service';
import { ConfigService } from '@nestjs/config';
import { CarService } from '../car/car.service';
import { RateService } from '../rate/rate.service';
import { DiscountService } from '../discount/discount.service';
import { ValidationService } from '../validation/validation.service';
import { CalculationService } from 'src/calculation/calculation.service';

@Module({
  controllers: [CostController],
  providers: [
    CostService,
    SessionService,
    PgService,
    ConfigService,
    CarService,
    RateService,
    DiscountService,
    ValidationService,
    CalculationService,
  ],
})
export class CostModule {}

import { Module } from '@nestjs/common';
import { PgService } from 'src/pg/pg.service';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { ConfigService } from '@nestjs/config';
import { CarService } from '../car/car.service';
import { RateService } from '../rate/rate.service';
import { DiscountService } from '../discount/discount.service';
import { ValidationService } from 'src/validation/validation.service';
import { CalculationService } from '../calculation/calculation.service';

@Module({
  controllers: [SessionController],
  providers: [
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
export class SessionModule {}

import { Module } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { PgService } from '../pg/pg.service';
import { ConfigModule } from '@nestjs/config';
import { RateService } from 'src/rate/rate.service';
import { CalculationService } from 'src/calculation/calculation.service';

@Module({
  imports: [ConfigModule],
  providers: [ValidationService, PgService, RateService, CalculationService],
})
export class ValidationModule {}

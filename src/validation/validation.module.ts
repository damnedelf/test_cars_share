import { Module } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { PgService } from '../pg/pg.service';
import { ConfigModule } from '@nestjs/config';
import { RateService } from 'src/rate/rate.service';

@Module({
  imports: [ConfigModule],
  providers: [ValidationService, PgService, RateService],
})
export class ValidationModule {}

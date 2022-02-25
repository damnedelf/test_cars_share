import { Module } from '@nestjs/common';
import { CarService } from './car.service';
import { PgService } from '../pg/pg.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [CarService, PgService, ConfigService],
})
export class CarModule {}

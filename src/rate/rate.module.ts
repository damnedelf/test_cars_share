import { Module } from '@nestjs/common';
import { RateService } from './rate.service';
import { PgService } from '../pg/pg.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [RateService, PgService, ConfigService],
})
export class RateModule {}

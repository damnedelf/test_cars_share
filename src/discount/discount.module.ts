import { Module } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { PgService } from '../pg/pg.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [DiscountService, PgService, ConfigService],
})
export class DiscountModule {}

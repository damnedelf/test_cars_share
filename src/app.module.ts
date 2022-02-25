import { Module } from '@nestjs/common';
import { SessionModule } from './session/session.module';
import { CarModule } from './car/car.module';
import { RateModule } from './rate/rate.module';
import { DiscountModule } from './discount/discount.module';
import { PgModule } from './pg/pg.module';
import { ConfigModule } from '@nestjs/config';
import { ValidationModule } from './validation/validation.module';
import { CostModule } from './cost/cost.module';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [
    SessionModule,
    CarModule,
    RateModule,
    DiscountModule,
    PgModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    ValidationModule,
    CostModule,
    StatsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

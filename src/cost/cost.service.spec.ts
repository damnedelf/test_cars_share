import { CostController } from './cost.controller';
import { CostService } from './cost.service';
import { Test } from '@nestjs/testing';
import { SessionService } from '../session/session.service';
import { PgService } from '../pg/pg.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CarService } from '../car/car.service';
import { RateService } from '../rate/rate.service';
import { DiscountService } from '../discount/discount.service';
import { ValidationService } from '../validation/validation.service';
import { CalculationService } from '../calculation/calculation.service';

import strCon from '../stringConsts';

describe('Cost service', () => {
  let costService: CostService;
  let pgService: PgService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env',
        }),
      ],
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
    }).compile();
    costService = await moduleRef.resolve(CostService);
    pgService = await moduleRef.resolve(PgService);
    await pgService.pg.query(
      'DELETE FROM sessions;UPDATE cars SET in_work=false;',
    );
  });

  describe('calculate rent:error', () => {
    it("should return error:CAR DOESN'T EXISTS OR IS BOOKED", async () => {
      expect(
        await costService.calculate({
          date_start: new Date('2022-03-01'),
          date_end: new Date('2022-03-03'),
          car_id: 6,
          mileagePerDay: 300,
        }),
      ).toBe(strCon.error.startCarIsNotFound);
    });
  });
  describe('calculate rent:error', () => {
    it('should return error:SESSION LAST MORE THAN 30 DAYS.', async () => {
      expect(
        await costService.calculate({
          date_start: new Date('2022-02-25'),
          date_end: new Date('2022-04-26'),
          car_id: 1,
          mileagePerDay: 300,
        }),
      ).toBe(strCon.error.close30DayLimitPassed);
    });
  });
  describe('success rent 1,  NO DISCOUNT', () => {
    it('should return price:540', async () => {
      expect(
        await costService.calculate({
          date_start: new Date('2022-03-01'),
          date_end: new Date('2022-03-02 18:51:04'),
          car_id: 1,
          mileagePerDay: 200,
        }),
      ).toBe(540);
    });
  });
  describe('success rent 3,   DISCOUNT 3', () => {
    it('should return price:540', async () => {
      expect(
        await costService.calculate({
          date_start: new Date('2022-03-01'),
          date_end: new Date('2022-03-16 18:51:04'),
          car_id: 1,
          mileagePerDay: 500,
        }),
      ).toBe(5304);
    });
  });
  describe('error: end_date weekend', () => {
    it("should return CAN'T CLOSE SESSION ON WEEKAND - NOBODY IN OFFICE", async () => {
      expect(
        await costService.calculate({
          date_start: new Date('2022-03-01'),
          date_end: new Date('2022-04-16'),
          car_id: 1,
          mileagePerDay: 500,
        }),
      ).toBe(strCon.error.closeOnWeekend);
    });
  });
  describe('error: start_date weekend', () => {
    it("CAN'T START SESSION ON WEEKAND - NOBODY IN OFFICE", async () => {
      expect(
        await costService.calculate({
          date_start: new Date('2022-02-26'),
          date_end: new Date('2022-03-12'),
          car_id: 1,
          mileagePerDay: 500,
        }),
      ).toBe(strCon.error.startOnWeekend);
    });
  });
});

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
import { CostService } from '../cost/cost.service';
import { SessionController } from './session.controller';

describe('Cost service', () => {
  let sessionService: SessionService;
  let pgService: PgService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env',
        }),
      ],
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
    }).compile();
    sessionService = await moduleRef.resolve(SessionService);
    pgService = await moduleRef.resolve(PgService);
    try {
      await pgService.pg.query(
        'DELETE FROM sessions;UPDATE cars SET in_work=false;',
      );
    } catch (e) {
      console.log(e);
    }
  });
  describe('start rent:error', () => {
    it("should return error:CAN'T START SESSION ON WEEKAND - NOBODY IN OFFICE", async () => {
      expect(
        await sessionService.start({
          date_start: new Date('2022-02-26'),
          date_end: new Date('2022-03-03'),
          car_id: 1,
          rate_id: 1,
        }),
      ).toBe(strCon.error.startOnWeekend);
    });
  });
  describe('start rent:success car1', () => {
    it('should return SUCCESSFUL SESSION START', async () => {
      expect(
        await sessionService.start({
          date_start: new Date('2022-02-28'),
          date_end: new Date('2022-03-04'),
          car_id: 1,
          rate_id: 1,
        }),
      ).toBe(strCon.success.start);
    });
  });
  describe('start rent:success car2', () => {
    it('should return SUCCESSFUL SESSION START', async () => {
      expect(
        await sessionService.start({
          date_start: new Date('2022-02-28'),
          date_end: new Date('2022-03-04'),
          car_id: 2,
          rate_id: 2,
        }),
      ).toBe(strCon.success.start);
    });
  });
  describe('start rent:error', () => {
    it("3 DAYS DIDN'T PASS. CAR CANNOT BE BOOKED", async () => {
      expect(
        await sessionService.start({
          date_start: new Date('2022-02-28'),
          date_end: new Date('2022-03-04'),
          car_id: 1,
          rate_id: 1,
        }),
      ).toBe(strCon.error.startLowPeriod);
    });
  });
  describe('start rent:error', () => {
    it('should return CAR IS BOOKED.', async () => {
      expect(
        await sessionService.start({
          date_start: new Date('2022-02-28'),
          date_end: new Date('2022-05-03'),
          car_id: 2,
          rate_id: 1,
        }),
      ).toBe(strCon.error.startCarIsNotFree);
    });
  });
  describe('close rent:error', () => {
    it("should return CAN'T CLOSE SESSION ON WEEKAND - NOBODY IN OFFICE", async () => {
      expect(
        await sessionService.close({
          date_end: new Date('2022-05-01'),
          car_id: 1,
          mileage: 1000,
        }),
      ).toBe(strCon.error.closeOnWeekend);
    });
  });
});

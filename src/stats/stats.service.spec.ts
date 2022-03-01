import { statsDTO } from './types';
import { RateService } from '../rate/rate.service';
import { ValidationService } from '../validation/validation.service';
import { CarService } from '../car/car.service';
import { DiscountService } from '../discount/discount.service';
import { ConfigService } from '@nestjs/config';
import { CalculationService } from '../calculation/calculation.service';
import { PgService } from '../pg/pg.service';
import { sessionsForTest } from '../../test/mockedData';
import { getSessionsByRange } from '../../test/mockedFoosForTest';
import { sessionType } from '../session/types';
import { StatsService } from './stats.service';
import { SessionService } from '../session/session.service';

const mockStatsService = {
  carsStats: jest.fn(
    (dto: statsDTO, calculationService: CalculationService) => {
      const stats = [];
      const dates: any = calculationService.getDaysArray(
        dto.date_start,
        dto.date_end,
      );
      const carId = parseInt(String(dto.car_id));
      const sessions: sessionType[] = !carId
        ? getSessionsByRange(sessionsForTest, dto.date_start, dto.date_end)
        : getSessionsByRange(
            sessionsForTest,
            dto.date_start,
            dto.date_end,
            carId,
          );

      if (!!dates.length && !!sessions.length) {
        dates.forEach((date) => {
          sessions.forEach((session: sessionType) => {
            const currentTime = new Date(date).getTime();
            const timeS = new Date(session.date_start).getTime();
            const timeE = new Date(session.date_end).getTime();
            const condition = carId
              ? session.car_id === carId &&
                currentTime >= timeS &&
                currentTime <= timeE
              : currentTime >= timeS && currentTime <= timeE;
            if (condition) {
              const statObj = {};
              statObj[date] = [];
              statObj[date].push(session);
              stats.push(statObj);
            }
          });
        });
      }
      return stats;
    },
  ),
};

describe('StatsService', () => {
  let statsService: StatsService;
  let carService: CarService;
  let rateService: RateService;
  let discountService: DiscountService;
  let validationService: ValidationService;
  let calculationService: CalculationService;
  let pgService: PgService;
  let configService: ConfigService;
  let sessionService: SessionService;
  beforeEach(async () => {
    configService = new ConfigService();
    pgService = new PgService(configService);
    calculationService = new CalculationService();
    carService = new CarService(pgService);
    rateService = new RateService(pgService);
    discountService = new DiscountService(pgService);
    validationService = new ValidationService(
      pgService,
      configService,
      rateService,
      calculationService,
    );
    sessionService = new SessionService(
      pgService,
      carService,
      rateService,
      discountService,
      validationService,
      calculationService,
      configService,
    );
    statsService = new StatsService(
      pgService,
      calculationService,
      sessionService,
    );
  });
  it('StatsService MOCK should be defined', () => {
    expect(mockStatsService).toBeDefined();
  });
  it('StatsService should be defined', () => {
    expect(statsService).toBeDefined();
  });
  it('StatsService empty arr - car 3 was not in use that days', () => {
    expect(
      mockStatsService.carsStats(
        {
          date_start: new Date('2022-02-26'),
          date_end: new Date('2022-02-28'),
          car_id: 3,
        },
        calculationService,
      ),
    ).toHaveLength(0);
  });
  it('StatsService   - car  1 was in use all 3 days', () => {
    expect(
      mockStatsService.carsStats(
        {
          date_start: new Date('2022-02-26'),
          date_end: new Date('2022-02-28'),
          car_id: 1,
        },
        calculationService,
      ),
    ).toHaveLength(3);
  });
  it('StatsService   - car  4 was in use only 1 day of below date range', () => {
    expect(
      mockStatsService.carsStats(
        {
          date_start: new Date('2022-02-17'),
          date_end: new Date('2022-02-19'),
          car_id: 4,
        },
        calculationService,
      ),
    ).toHaveLength(1);
  });
  it('StatsService : for all cars  - some cars were in use 2 days of below date range', () => {
    expect(
      mockStatsService.carsStats(
        {
          date_start: new Date('2022-02-17'),
          date_end: new Date('2022-02-19'),
        },
        calculationService,
      ),
    ).toHaveLength(2);
  });
});

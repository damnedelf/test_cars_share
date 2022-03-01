import { Test, TestingModule } from '@nestjs/testing';

import {
  discountType,
  getDiscountRes,
  rateType,
  sessionCloseDTO,
  sessionStartDTO,
  sessionType,
} from './types';
import strCon from '../stringConsts';
import { carType } from '../cost/types';
import { SessionService } from './session.service';
import { RateService } from '../rate/rate.service';
import { ValidationService } from '../validation/validation.service';
import { CarService } from '../car/car.service';
import { DiscountService } from '../discount/discount.service';
import { ConfigService } from '@nestjs/config';
import { CalculationService } from '../calculation/calculation.service';
import { PgService } from '../pg/pg.service';
import {
  carsForTest,
  discountsForTest,
  ratesForTest,
  sessionsForTest,
} from '../../test/mockedData';
import {
  validateForClose,
  validateForStart,
} from '../../test/mockedFoosForTest';

const mockSessionService = {
  start: jest.fn((dto: sessionStartDTO) => {
    try {
      const car = carsForTest.find((it: carType) => dto.car_id === it.id);
      const validate = validateForStart(dto, car);
      if (validate !== strCon.success.start) {
        return validate;
      }
      return strCon.success.start;
    } catch (e) {
      return strCon.error.start;
    }
  }),
  close: jest.fn(
    (dto: sessionCloseDTO, calculationService: CalculationService) => {
      const currentSession = sessionsForTest.find(
        (it: sessionType) => it.car_id === dto.car_id && it.is_active,
      );
      if (!currentSession) {
        return strCon.error.closeSessionNotFound;
      }
      let validateObj: {
        kmPerDay: number;
        totalHours: number;
        fineStatus: { [key: string]: number };
      };
      const validate = validateForClose(
        dto,
        currentSession,
        calculationService,
      );
      if (typeof validate === 'string') {
        return validate;
      } else {
        validateObj = validate;
      }
      const sessionId = currentSession.id;
      const rate_id = currentSession.rate_id;
      let summ = 0;
      let finalQString = 'UPDATE sessions SET ';
      const days = calculationService.getDays(
        currentSession.date_start,
        dto.date_end,
      );
      if (!Object.keys(validateObj.fineStatus).length) {
        const rate = ratesForTest.find((it: rateType) => it.id === rate_id);

        const discount: getDiscountRes = discountsForTest.find(
          (it: discountType) => days >= it.min && days <= it.max,
        );
        if (rate) {
          summ = days * rate.cost;
        }
        if (discount) {
          finalQString = finalQString + `discount_id=${discount.id}, `;
          summ = summ - Math.floor((summ * discount.discount_percent) / 100);
        }
        finalQString =
          finalQString +
          `date_end=${dto.date_end}, summ=${summ}, is_active=false, mileage=${dto.mileage} WHERE id=${sessionId};`;
        return finalQString;
      } else {
        summ = days * 500;
        if (!!validateObj.fineStatus[strCon.error.close30DayLimitPassed]) {
          finalQString =
            finalQString +
            `excess_days=${
              validateObj.fineStatus[strCon.error.close30DayLimitPassed]
            },`;
        }
        if (!!validateObj.fineStatus[strCon.error.closeOverTax]) {
          finalQString =
            finalQString +
            `excess_km=${validateObj.fineStatus[strCon.error.closeOverTax]}, `;
        }
        return `${finalQString}  fine=true, summ=${summ}::integer, date_end=${dto.date_end}, mileage=${dto.mileage} WHERE id=${sessionId};`;
      }
    },
  ),
};

describe('SessionService', () => {
  let sessionServiceForReplace: SessionService;
  let sessionService: SessionService;
  let carService: CarService;
  let rateService: RateService;
  let discountService: DiscountService;
  let validationService: ValidationService;
  let calculationService: CalculationService;
  let pgService: PgService;
  let configService: ConfigService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
      .overrideProvider(SessionService)
      .useValue(mockSessionService)
      .compile();
    sessionServiceForReplace = module.get<SessionService>(SessionService);
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
  });
  it('SessionService MOCK should be defined', () => {
    expect(mockSessionService).toBeDefined();
  });
  it('SessionService should be defined', () => {
    expect(sessionService).toBeDefined();
  });
  it('SessionService start: error : DATE START IS WEEKEND', () => {
    expect(
      mockSessionService.start({
        date_start: new Date('2022-02-26'),
        date_end: new Date('2022-02-28'),
        car_id: 3,
        rate_id: 1,
      }),
    ).toEqual(strCon.error.startOnWeekend);
  });
  it('SessionService start: error : DATE CLOSE IS WEEKEND', () => {
    expect(
      mockSessionService.start({
        date_start: new Date('2022-02-23'),
        date_end: new Date('2022-02-26'),
        car_id: 3,
        rate_id: 1,
      }),
    ).toEqual(strCon.error.closeOnWeekend);
  });

  it('SessionService start: error : car Busy', () => {
    expect(
      mockSessionService.start({
        date_start: new Date('2022-02-21'),
        date_end: new Date('2022-02-24'),
        car_id: 1,
        rate_id: 1,
      }),
    ).toEqual(strCon.error.startCarIsNotFree);
  });

  it("SessionService start: error : 3  days from last booking doesn't passed", () => {
    expect(
      mockSessionService.start({
        date_start: new Date('2022-02-04'),
        date_end: new Date('2022-02-24'),
        car_id: 2,
        rate_id: 1,
      }),
    ).toEqual(strCon.error.startLowPeriod);
  });

  it('SessionService start: error : date range more then 30 days', () => {
    expect(
      mockSessionService.start({
        date_start: new Date('2022-02-04'),
        date_end: new Date('2022-03-24'),
        car_id: 3,
        rate_id: 1,
      }),
    ).toEqual(strCon.error.close30DayLimitPassed);
  });

  it('SessionService start: success', () => {
    expect(
      mockSessionService.start({
        date_start: new Date('2022-03-22'),
        date_end: new Date('2022-03-24'),
        car_id: 3,
        rate_id: 1,
      }),
    ).toEqual(strCon.success.start);
  });
  it('SessionService close: error - session not found', () => {
    expect(
      mockSessionService.close(
        {
          date_end: new Date('2022-03-24'),
          car_id: 3,
          mileage: 1000,
        },
        calculationService,
      ),
    ).toEqual(strCon.error.closeSessionNotFound);
  });
  it('SessionService close: error - close on weekand', () => {
    expect(
      mockSessionService.close(
        {
          date_end: new Date('2022-02-27'),
          car_id: 4,
          mileage: 1000,
        },
        calculationService,
      ),
    ).toEqual(strCon.error.closeOnWeekend);
  });
  it('SessionService close: got fines by daysLimit', () => {
    expect(
      mockSessionService.close(
        {
          date_end: new Date('2022-03-24'),
          car_id: 4,
          mileage: 1000,
        },
        calculationService,
      ),
    ).toEqual(
      'UPDATE sessions SET excess_days=33,  fine=true, summ=17000::integer, date_end=Thu Mar 24 2022 03:00:00 GMT+0300 (Moscow Standard Time), mileage=1000 WHERE id=5;',
    );
  });
  it('SessionService close: got fines by mileageLimit', () => {
    expect(
      mockSessionService.close(
        {
          date_end: new Date('2022-02-24'),
          car_id: 4,
          mileage: 10000,
        },
        calculationService,
      ),
    ).toEqual(
      'UPDATE sessions SET excess_km=8020,   fine=true, summ=3000::integer, date_end=Thu Feb 24 2022 03:00:00 GMT+0300 (Moscow Standard Time), mileage=10000 WHERE id=5;',
    );
  });
  it('SessionService close: success - with discount', () => {
    expect(
      mockSessionService.close(
        {
          date_end: new Date('2022-02-24'),
          car_id: 4,
          mileage: 1000,
        },
        calculationService,
      ),
    ).toEqual(
      'UPDATE sessions SET discount_id=2, date_end=Thu Feb 24 2022 03:00:00 GMT+0300 (Moscow Standard Time), summ=1782, is_active=false, mileage=1000 WHERE id=5;',
    );
  });
});

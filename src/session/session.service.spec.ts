import { Test, TestingModule } from '@nestjs/testing';

import {
  getTaxRes,
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

const cars: carType[] = [
  {
    id: 1,
    brand: 'Lada',
    model: 'Vesta 1.6',
    vin: '4Y1SL65848Z411439',
    number: 'A123BC 111RUS',
    in_work: true,
  },
  {
    id: 2,
    brand: 'KIA',
    model: 'Soul 2.0',
    vin: '4Y1SL65848Z411438',
    number: 'A456BC 121RUS',
    in_work: false,
  },
  {
    id: 3,
    brand: 'HONDA',
    model: 'CRV 2.4',
    vin: '4Y1SL65848Z411437',
    number: 'A789BC 131RUS',
    in_work: false,
  },
  {
    id: 4,
    brand: 'HYUNDAI',
    model: 'GETZ 1.1',
    vin: '4Y1SL65848Z411436',
    number: 'A012BC 141RUS',
    in_work: false,
  },
  {
    id: 5,
    brand: 'GEELY',
    model: 'ATLAS 2.4',
    vin: '4Y1SL65848Z411435',
    number: 'A345BC 151RUS',
    in_work: false,
  },
];

const sessions: sessionType[] = [
  {
    id: 1,
    is_active: false,
    summ: 5000,
    excess_days: 0,
    excess_km: 0,
    fine: false,
    date_start: new Date('2022-02-01'),
    date_end: new Date('2022-02-10'),
    mileage: 500,
    car_id: 1,
    rate_id: 2,
    discount_id: 3,
  },
  {
    id: 2,
    is_active: false,
    summ: 1000,
    excess_days: 0,
    excess_km: 0,
    fine: false,
    date_start: new Date('2022-02-14'),
    date_end: new Date('2022-02-28'),
    mileage: 3000,
    car_id: 1,
    rate_id: 1,
    discount_id: 2,
  },
  {
    id: 3,
    is_active: false,
    summ: 1333,
    excess_days: 0,
    excess_km: 7000,
    fine: true,
    date_start: new Date('2022-02-01'),
    date_end: new Date('2022-02-03'),
    mileage: 8000,
    car_id: 2,
    rate_id: 3,
    discount_id: 0,
  },
  {
    id: 4,
    is_active: false,
    summ: 6666,
    excess_days: 0,
    excess_km: 0,
    fine: false,
    date_start: new Date('2022-02-19'),
    date_end: new Date('2022-02-24'),
    mileage: 1000,
    car_id: 2,
    rate_id: 2,
    discount_id: 3,
  },
];

const weekends = ['воскресенье', 'суббота'];
const locale = 'ru-RU';
const rates: rateType[] = [
  {
    id: 1,
    cost: 270,
    mileage: 200,
  },
  {
    id: 2,
    cost: 330,
    mileage: 350,
  },
  {
    id: 3,
    cost: 390,
    mileage: 500,
  },
];

function validateForStart(dto: sessionStartDTO, car: carType) {
  if (
    validateDateIsWeekendOnStart(dto.date_start) === strCon.error.startOnWeekend
  ) {
    return strCon.error.startOnWeekend;
  }
  if (
    validateDateIsWeekendOnClose(dto.date_end) === strCon.error.closeOnWeekend
  ) {
    return strCon.error.closeOnWeekend;
  }
  if (
    validate30DaysLimitOnClose(dto.date_start, dto.date_end).message ===
    strCon.error.close30DayLimitPassed
  ) {
    return strCon.error.close30DayLimitPassed;
  }
  const errorOrValidCar = validateCarOnStart(car);
  //case error
  if (typeof errorOrValidCar == 'string') {
    return errorOrValidCar;
  }
  const carId = errorOrValidCar.id;
  if (
    validate3DaysRangeOnStart(carId, dto.date_start) ===
    strCon.error.startLowPeriod
  ) {
    return strCon.error.startLowPeriod;
  }
  return strCon.success.start;
}

function validateForClose(
  dto: sessionCloseDTO,
  currentSession: sessionType,
  calculationService,
) {
  const fineStatus: { [key: string]: number } = {};
  if (
    validateDateIsWeekendOnClose(dto.date_end) === strCon.error.closeOnWeekend
  ) {
    return strCon.error.closeOnWeekend;
  }
  const validate30Days = validate30DaysLimitOnClose(
    currentSession.date_start,
    dto.date_end,
  );
  if (validate30Days.message === strCon.error.close30DayLimitPassed) {
    fineStatus[strCon.error.close30DayLimitPassed] = validate30Days.value;
  }
  const totalHours = calculationService.getHours(
    currentSession.date_start,
    dto.date_end,
  );
  const kmPerDay = calculationService.getKmPerDay(totalHours, dto.mileage);
  const validateAvMil = validateAverageMileage(
    currentSession.date_start,
    dto.date_end,
    dto.mileage,
    false,
    currentSession.rate_id,
    calculationService,
  );
  if (validateAvMil.message === strCon.error.closeOverTax) {
    fineStatus[strCon.error.closeOverTax] = validateAvMil.value;
  }
  return { kmPerDay, totalHours, fineStatus };
}

function validateAverageMileage(
  date_start: Date,
  date_end: Date,
  mileage: number,
  calc = false,
  rate_id = 0,
  calculationService,
) {
  let maxKm = 500;
  if (rate_id) {
    const rate: getTaxRes = rates.find((it: rateType) => it.id === rate_id);
    maxKm = !!rate ? rate.cost : 500;
  }
  const totalHours = calculationService.getHours(date_start, date_end);
  const kmPerDay = calc
    ? mileage
    : calculationService.getKmPerDay(totalHours, mileage);
  if (kmPerDay <= maxKm) {
    return { message: strCon.success.closeOverTax };
  } else {
    const diff = mileage - this.maxDaysRent * maxKm;
    return { message: strCon.error.closeOverTax, value: diff };
  }
}
function validateDateIsWeekendOnStart(date: Date): string {
  const isWeekend = weekends.find(
    (day: string) =>
      day === new Date(date).toLocaleDateString(locale, { weekday: 'long' }),
  );
  if (!!isWeekend) {
    return strCon.error.startOnWeekend;
  } else {
    return strCon.success.startDateNotWeekend;
  }
}

function validateDateIsWeekendOnClose(date: Date): string {
  const isWeekend = weekends.find(
    (day: string) =>
      day === new Date(date).toLocaleDateString(locale, { weekday: 'long' }),
  );
  if (!!isWeekend) {
    return strCon.error.closeOnWeekend;
  } else {
    return strCon.success.startDateNotWeekend;
  }
}

function validate30DaysLimitOnClose(startDate: Date, closeDate: Date) {
  const diff = Math.ceil(
    Math.floor(new Date(closeDate).valueOf() - new Date(startDate).valueOf()) /
      36e5 /
      24,
  );
  if (diff > 30) {
    return { message: strCon.error.close30DayLimitPassed, value: diff };
  } else {
    return { message: strCon.success.close30DayLimitNotPassed };
  }
}

function validate3DaysRangeOnStart(carId: number, startDate: Date): string {
  const lastCarSession = sessions.reduce(function (r, a) {
    return r.date_end > a.date_end ? r : a;
  });
  if (!lastCarSession) {
    return strCon.success.startDate3DayRange;
  }
  const compareDate = new Date(startDate);
  const lastDateBooked = lastCarSession.date_end;
  const diff = Math.ceil(
    Math.floor(
      new Date(compareDate).valueOf() - new Date(lastDateBooked).valueOf(),
    ) /
      36e5 /
      24,
  );
  if (diff >= 3) {
    return strCon.success.startDate3DayRange;
  } else {
    return strCon.error.startLowPeriod;
  }
}

function validateCarOnStart(car: carType) {
  if (!car) {
    return strCon.error.startCarIsNotFound;
  }
  if (car?.in_work) {
    return strCon.error.startCarIsNotFree;
  }
  return car;
}
const mockSessionService = {
  start: jest.fn((dto: sessionStartDTO) => {
    try {
      const car = cars.find((it: carType) => dto.car_id === it.id);
      const validate = validateForStart(dto, car);
      if (validate !== strCon.success.start) {
        return validate;
      }
      return strCon.success.start;
    } catch (e) {
      return strCon.error.start;
    }
  }),
  close: jest.fn(() => {
    return 0;
  }),
};

describe('[CLASS] SessionService', () => {
  // let mockSessionService: SessionService;
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
    // mockSessionService = module.get<SessionService>(SessionService);
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
});

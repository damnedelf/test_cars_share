import { costCalcDTO } from './types';
import strCon from '../stringConsts';
import { carType } from '../cost/types';
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
} from '../../test/mockedData';
import { validateForCost } from '../../test/mockedFoosForTest';
import { discountType, rateType } from '../session/types';
import { CostService } from './cost.service';

const mockCostService = {
  calculate: jest.fn(
    (dto: costCalcDTO, calculationService: CalculationService) => {
      let summ = 0;
      const car = carsForTest.find((it: carType) => it.id === dto.car_id);
      const isValid = validateForCost(dto, car);
      if (isValid !== strCon.success.start) {
        return isValid;
      }
      const days = calculationService.getDays(dto.date_start, dto.date_end);
      const tax: rateType = ratesForTest.find(
        (it: rateType) => dto.mileagePerDay <= it.mileage,
      );
      if (!tax) {
        return strCon.error.closeOverTax;
      }
      summ = days * tax.cost;
      const discount: discountType = discountsForTest.find(
        (it: discountType) => it.min <= days && it.max >= days,
      );
      if (discount) {
        summ = summ - Math.floor((summ * discount.discount_percent) / 100);
      }
      return summ;
    },
  ),
};

describe('CostService', () => {
  let costService: CostService;
  let carService: CarService;
  let rateService: RateService;
  let discountService: DiscountService;
  let validationService: ValidationService;
  let calculationService: CalculationService;
  let pgService: PgService;
  let configService: ConfigService;
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
    costService = new CostService(
      pgService,
      carService,
      rateService,
      discountService,
      validationService,
      calculationService,
    );
  });
  it('CostService MOCK should be defined', () => {
    expect(mockCostService).toBeDefined();
  });
  it('CostService should be defined', () => {
    expect(costService).toBeDefined();
  });
  it('CostService start: error : DATE START IS WEEKEND', () => {
    expect(
      mockCostService.calculate(
        {
          date_start: new Date('2022-02-26'),
          date_end: new Date('2022-02-28'),
          car_id: 3,
          mileagePerDay: 500,
        },
        calculationService,
      ),
    ).toEqual(strCon.error.startOnWeekend);
  });
  it('CostService error : car Busy', () => {
    expect(
      mockCostService.calculate(
        {
          date_start: new Date('2022-02-21'),
          date_end: new Date('2022-02-24'),
          car_id: 1,
          mileagePerDay: 500,
        },
        calculationService,
      ),
    ).toEqual(strCon.error.startCarIsNotFree);
  });

  it("CostService  error : 3  days from last booking doesn't passed", () => {
    expect(
      mockCostService.calculate(
        {
          date_start: new Date('2022-02-04'),
          date_end: new Date('2022-02-24'),
          car_id: 2,
          mileagePerDay: 500,
        },
        calculationService,
      ),
    ).toEqual(strCon.error.startLowPeriod);
  });

  it('CostService  error : date range more then 30 days', () => {
    expect(
      mockCostService.calculate(
        {
          date_start: new Date('2022-02-04'),
          date_end: new Date('2022-03-24'),
          car_id: 3,
          mileagePerDay: 500,
        },
        calculationService,
      ),
    ).toEqual(strCon.error.close30DayLimitPassed);
  });
  it('CostService  error : mileage limit exceeded', () => {
    expect(
      mockCostService.calculate(
        {
          date_start: new Date('2022-02-04'),
          date_end: new Date('2022-02-21'),
          car_id: 5,
          mileagePerDay: 600,
        },
        calculationService,
      ),
    ).toEqual(strCon.error.closeOverTax);
  });
  it('CostService  error : wrong car id', () => {
    expect(
      mockCostService.calculate(
        {
          date_start: new Date('2022-02-04'),
          date_end: new Date('2022-02-21'),
          car_id: 6,
          mileagePerDay: 600,
        },
        calculationService,
      ),
    ).toEqual(strCon.error.startCarIsNotFound);
  });
  it('CostService  success : 2 days + max rate with no discount 2*390 ', () => {
    expect(
      mockCostService.calculate(
        {
          date_start: new Date('2022-02-07'),
          date_end: new Date('2022-02-08'),
          car_id: 5,
          mileagePerDay: 500,
        },
        calculationService,
      ),
    ).toEqual(780);
  });

  it('CostService  success : 3 days + max rate with  discount 5% 3*390*0.95 + ceil', () => {
    expect(
      mockCostService.calculate(
        {
          date_start: new Date('2022-02-07'),
          date_end: new Date('2022-02-09'),
          car_id: 5,
          mileagePerDay: 500,
        },
        calculationService,
      ),
    ).toEqual(1112);
  });
});

import { Injectable } from '@nestjs/common';
import { costCalcDTO } from './types';
import { PgService } from '../pg/pg.service';
import { CarService } from '../car/car.service';
import { RateService } from '../rate/rate.service';
import { DiscountService } from '../discount/discount.service';
import { ValidationService } from '../validation/validation.service';
import strCon from '../stringConsts';
import { getDiscountRes, getTaxRes } from '../session/types';
import { CalculationService } from '../calculation/calculation.service';
@Injectable()
export class CostService {
  constructor(
    private readonly pgService: PgService,
    private readonly carService: CarService,
    private readonly taxService: RateService,
    private readonly discountService: DiscountService,
    private readonly validationService: ValidationService,
    private readonly calculationService: CalculationService,
  ) {}
  async calculate(dto: costCalcDTO) {
    let summ = 0;
    const car = await this.carService.getFreeCar(dto.car_id);
    const isValid = await this.validationService.validateForCost(dto, car);
    if (isValid !== strCon.success.start) {
      return isValid;
    }
    const totalHours = this.calculationService.getHours(
      dto.date_start,
      dto.date_end,
    );
    const days = this.calculationService.getDays(totalHours);
    const tax: getTaxRes = await this.taxService.getRateByKm(dto.mileagePerDay);
    if (tax) summ = days * tax.cost;
    const discount: getDiscountRes = await this.discountService.getDiscount(
      days,
    );
    if (discount)
      summ = summ - Math.floor((summ * discount.discount_percent) / 100);
    return summ;
  }
}

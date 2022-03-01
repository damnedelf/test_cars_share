import { Injectable } from '@nestjs/common';
import { PgService } from '../pg/pg.service';
import {
  getDiscountRes,
  getTaxRes,
  sessionCloseDTO,
  sessionStartDTO,
  sessionType,
} from './types';
import { CarService } from '../car/car.service';

import { DiscountService } from '../discount/discount.service';
import strCon from '../stringConsts';
import { QueryResult } from 'pg';
import { ValidationService } from '../validation/validation.service';
import { CalculationService } from '../calculation/calculation.service';
import { RateService } from '../rate/rate.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionService {
  private readonly maxKM: number;
  private readonly maxSummPerDay: number;
  constructor(
    private readonly pgService: PgService,
    private readonly carService: CarService,
    private readonly rateService: RateService,
    private readonly discountService: DiscountService,
    private readonly validationService: ValidationService,
    private readonly calculationService: CalculationService,
    private readonly configService: ConfigService,
  ) {
    this.maxKM = this.configService.get<number>('VALIDATE_MAX_KM');
    this.maxSummPerDay = this.configService.get<number>('VALIDATE_MAX_SUMM');
  }

  async start(dto: sessionStartDTO): Promise<string> {
    try {
      const car = await this.carService.getCar(dto.car_id);
      const validate = await this.validationService.validateForStart(dto, car);
      if (validate !== strCon.success.start) {
        return validate;
      }
      await this.carService.startWork(dto.car_id);
      await this.pgService.pg.query(
        'INSERT INTO sessions (car_id,date_start,date_end,rate_id,is_active) VALUES ($1,$2,$3,$4,$5);',
        [dto.car_id, dto.date_start, dto.date_end, dto.rate_id, true],
      );
      return strCon.success.start;
    } catch (e) {
      console.log(e);
      return strCon.error.start;
    }
  }

  async close(dto: sessionCloseDTO): Promise<string> {
    const currentSession = await this.getActiveSession(dto.car_id);
    if (!currentSession.rows[0]) {
      return strCon.error.closeSessionNotFound;
    }
    let validateObj: {
      kmPerDay: number;
      totalHours: number;
      fineStatus: { [key: string]: number };
    };
    const validate = await this.validationService.validateForClose(
      dto,
      currentSession,
    );
    if (typeof validate === 'string') {
      return validate;
    } else {
      validateObj = validate;
    }
    const sessionId = currentSession.rows[0].id;
    const carId = currentSession.rows[0].car_id;
    const rate_id = currentSession.rows[0].rate_id;
    await this.carService.stopWork(carId);
    let summ = 0;
    const argsForQ = [];
    let finalQString = 'UPDATE sessions SET ';
    const days = this.calculationService.getDays(
      currentSession.rows[0].date_start,
      dto.date_end,
    );
    if (!Object.keys(validateObj.fineStatus).length) {
      let index = 1;
      const rate = await this.rateService.getRateById(rate_id);

      const discount: getDiscountRes = await this.discountService.getDiscount(
        days,
      );
      if (rate) {
        summ = days * rate.cost;
      }
      if (discount) {
        finalQString = finalQString + `discount_id=$${index++}, `;
        argsForQ.push(discount.id);
        summ = summ - Math.floor((summ * discount.discount_percent) / 100);
      }
      argsForQ.push(dto.date_end);
      argsForQ.push(summ);
      argsForQ.push(dto.mileage);
      argsForQ.push(sessionId);
      finalQString =
        finalQString +
        `date_end=$${index++}, summ=$${index++}, is_active=false, mileage=$${index++} WHERE id=$${index++};`;
      await this.pgService.pg.query(finalQString, argsForQ);
    } else {
      summ = days * this.maxSummPerDay;
      let index = 1;
      if (!!validateObj.fineStatus[strCon.error.close30DayLimitPassed]) {
        finalQString = finalQString + `excess_days=$${index++},`;
        argsForQ.push(
          validateObj.fineStatus[strCon.error.close30DayLimitPassed],
        );
      }
      if (!!validateObj.fineStatus[strCon.error.closeOverTax]) {
        finalQString = finalQString + `excess_km=$${index++}, `;
        argsForQ.push(validateObj.fineStatus[strCon.error.closeOverTax]);
      }
      argsForQ.push(summ);
      argsForQ.push(dto.date_end);
      argsForQ.push(dto.mileage);
      argsForQ.push(sessionId);
      await this.pgService.pg.query(
        `${finalQString}  fine=true, summ=$${index++}::integer, date_end=$${index++}, mileage=$${index++}, is_active=false WHERE id=$${index++};`,
        argsForQ,
      );
      return strCon.success.closedWithFines;
    }
    return strCon.success.close;
  }

  async getActiveSession(car_id: number): Promise<QueryResult> {
    const currentSession = await this.pgService.pg.query(
      'SELECT * from sessions WHERE car_id =$1 and is_active=true;',
      [car_id],
    );
    return currentSession;
  }

  async getSessionsByRange(
    dateStart: Date,
    dateEnd: Date,
    carId: number | null = null,
  ): Promise<sessionType[]> {
    const sessions: QueryResult = !!carId
      ? await this.pgService.pg.query(
          'SELECT * FROM sessions WHERE ((date_start>=$1 AND date_start<=$2) OR (date_end>=$1 AND date_end<=$2)) AND car_id=$3;',
          [new Date(dateStart), new Date(dateEnd), carId],
        )
      : await this.pgService.pg.query(
          'SELECT * FROM sessions WHERE ((date_start>=$1 AND date_start<=$2) OR (date_end>=$1 AND date_end<=$2));',
          [new Date(dateStart), new Date(dateEnd)],
        );
    return sessions.rows;
  }
}

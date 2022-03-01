import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import strCon from '../stringConsts';
import { PgService } from '../pg/pg.service';
import { ConfigService } from '@nestjs/config';
import { costCalcDTO } from '../cost/types';
import { getTaxRes, sessionCloseDTO, sessionStartDTO } from '../session/types';
import { RateService } from '../rate/rate.service';
import { CalculationService } from '../calculation/calculation.service';

@Injectable()
export class ValidationService {
  private readonly local: string;
  private readonly weekends: string[];
  private readonly maxKM: number;
  private readonly maxDaysRent: number;
  private readonly maxDaysBetweenRent: number;
  constructor(
    private readonly pgService: PgService,
    private readonly configService: ConfigService,
    private readonly rateService: RateService,
    private readonly calculationService: CalculationService,
  ) {
    this.local = this.configService.get<string>('DATE_LOCAL');
    this.weekends = [
      this.configService.get<string>('DATE_WEEKEND1'),
      this.configService.get<string>('DATE_WEEKEND2'),
    ];
    this.maxKM = this.configService.get<number>('VALIDATE_MAX_KM');
    this.maxDaysRent = this.configService.get<number>('VALIDATE_MAX_DAYS_RENT');
    this.maxDaysBetweenRent = this.configService.get<number>(
      'VALIDATE_MAX_DAYS_BETWEEN_RENTS',
    );
  }

  async validateForCost(dto: costCalcDTO, car): Promise<string> {
    if (
      this.validateDateIsWeekendOnStart(dto.date_start) ===
      strCon.error.startOnWeekend
    ) {
      return strCon.error.startOnWeekend;
    }
    if (
      this.validateDateIsWeekendOnClose(dto.date_end) ===
      strCon.error.closeOnWeekend
    ) {
      return strCon.error.closeOnWeekend;
    }
    if (
      this.validate30DaysLimitOnClose(dto.date_start, dto.date_end).message ===
      strCon.error.close30DayLimitPassed
    ) {
      return strCon.error.close30DayLimitPassed;
    }
    const errorOrValidCar = this.validateCarOnStart(car);
    if (typeof errorOrValidCar == 'string') {
      return errorOrValidCar;
    }
    if (
      (await this.validate3DaysRangeOnStart(
        errorOrValidCar.id,
        dto.date_start,
      )) === strCon.error.startLowPeriod
    ) {
      return strCon.error.startLowPeriod;
    }

    return strCon.success.start;
  }

  async validateForStart(dto: sessionStartDTO, car): Promise<string> {
    if (
      this.validateDateIsWeekendOnStart(dto.date_start) ===
      strCon.error.startOnWeekend
    ) {
      return strCon.error.startOnWeekend;
    }
    if (
      this.validateDateIsWeekendOnClose(dto.date_end) ===
      strCon.error.closeOnWeekend
    ) {
      return strCon.error.closeOnWeekend;
    }

    if (
      this.validate30DaysLimitOnClose(dto.date_start, dto.date_end).message ===
      strCon.error.close30DayLimitPassed
    ) {
      return strCon.error.close30DayLimitPassed;
    }
    const errorOrValidCar = this.validateCarOnStart(car);
    if (typeof errorOrValidCar == 'string') {
      return errorOrValidCar;
    }
    const carId = errorOrValidCar.id;
    if (
      (await this.validate3DaysRangeOnStart(carId, dto.date_start)) ===
      strCon.error.startLowPeriod
    ) {
      return strCon.error.startLowPeriod;
    }
    return strCon.success.start;
  }

  async validateForClose(dto: sessionCloseDTO, currentSession) {
    const fineStatus: { [key: string]: number } = {};
    if (
      this.validateDateIsWeekendOnClose(dto.date_end) ===
      strCon.error.closeOnWeekend
    ) {
      return strCon.error.closeOnWeekend;
    }
    const validate30DaysLimitOnClose = this.validate30DaysLimitOnClose(
      currentSession.rows[0].date_start,
      dto.date_end,
      currentSession.rows[0].date_end,
    );
    if (
      validate30DaysLimitOnClose.message === strCon.error.close30DayLimitPassed
    ) {
      fineStatus[strCon.error.close30DayLimitPassed] =
        validate30DaysLimitOnClose.value;
    }
    const totalHours = this.calculationService.getHours(
      currentSession.rows[0].date_start,
      dto.date_end,
    );
    const kmPerDay = this.calculationService.getKmPerDay(
      totalHours,
      dto.mileage,
    );
    const validateAverageMileage = await this.validateAverageMileage(
      currentSession.rows[0].date_start,
      dto.date_end,
      dto.mileage,
    );
    if (validateAverageMileage.message === strCon.error.closeOverTax) {
      fineStatus[strCon.error.closeOverTax] = validateAverageMileage.value;
    }
    return { kmPerDay, totalHours, fineStatus };
  }

  validateCarOnStart(carReq: QueryResult) {
    if (!carReq.rows.length) {
      return strCon.error.startCarIsNotFound;
    }
    if (carReq.rows[0]?.in_work) {
      return strCon.error.startCarIsNotFree;
    }
    return carReq.rows[0];
  }

  validateDateIsWeekendOnStart(date: Date): string {
    //As this is just a test task to simplify the logic we are not working with calendars, timezones, locales, etc.
    const isWeekend = this.weekends.find(
      (day: string) =>
        day ===
        new Date(date).toLocaleDateString(this.local, { weekday: 'long' }),
    );
    if (!!isWeekend) {
      return strCon.error.startOnWeekend;
    } else {
      return strCon.success.startDateNotWeekend;
    }
  }

  async validate3DaysRangeOnStart(
    carId: number,
    startDate: Date,
  ): Promise<string> {
    const lastCarSessions = await this.pgService.pg.query(
      `SELECT date_end FROM sessions WHERE car_id=$1 ORDER BY date_end DESC LIMIT 1;`,
      [carId],
    );
    if (!lastCarSessions.rows.length) {
      return strCon.success.startDate3DayRange;
    }
    const compareDate = new Date(startDate);
    const lastDateBooked = lastCarSessions.rows[0].date_end;
    const diff = Math.ceil(
      Math.floor(
        new Date(compareDate).valueOf() - new Date(lastDateBooked).valueOf(),
      ) /
        36e5 /
        24,
    );
    if (diff >= this.maxDaysBetweenRent) {
      return strCon.success.startDate3DayRange;
    } else {
      return strCon.error.startLowPeriod;
    }
  }

  validateDateIsWeekendOnClose(date: Date): string {
    const isWeekend = this.weekends.find(
      (day: string) =>
        day ===
        new Date(date).toLocaleDateString(this.local, { weekday: 'long' }),
    );
    if (!!isWeekend) {
      return strCon.error.closeOnWeekend;
    } else {
      return strCon.success.startDateNotWeekend;
    }
  }

  validate30DaysLimitOnClose(
    startDate: Date,
    closeDate: Date,
    promiseEndDate: Date = closeDate,
  ) {
    const diff = Math.ceil(
      Math.floor(
        new Date(closeDate).valueOf() - new Date(startDate).valueOf(),
      ) /
        36e5 /
        24,
    );
    const promiseDiff = Math.ceil(
      Math.floor(
        new Date(promiseEndDate).valueOf() - new Date(startDate).valueOf(),
      ) /
        36e5 /
        24,
    );
    const diffCondition =
      diff == promiseDiff ? diff > this.maxDaysRent : diff > promiseDiff;
    const diffValue = diff == promiseDiff ? diff : diff - promiseDiff;
    if (diffCondition) {
      return { message: strCon.error.close30DayLimitPassed, value: diffValue };
    } else {
      return { message: strCon.success.close30DayLimitNotPassed };
    }
  }

  async validateAverageMileage(
    date_start: Date,
    date_end: Date,
    mileage: number,
    calc = false,
    rate_id = 0,
  ) {
    let maxKm = this.maxKM;
    if (rate_id) {
      const rate: getTaxRes = await this.rateService.getRateById(rate_id);
      maxKm = !!rate ? rate.cost : this.maxKM;
    }
    const totalHours = this.calculationService.getHours(date_start, date_end);
    const kmPerDay = calc
      ? mileage
      : this.calculationService.getKmPerDay(totalHours, mileage);
    if (kmPerDay <= maxKm) {
      return { message: strCon.success.closeOverTax };
    } else {
      const diff = this.maxDaysRent * maxKm - mileage;
      return { message: strCon.error.closeOverTax, value: diff };
    }
  }
}

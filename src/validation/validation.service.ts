import { Injectable } from '@nestjs/common';
import { QueryResult } from 'pg';
import strCon from '../stringConsts';
import { PgService } from '../pg/pg.service';
import { ConfigService } from '@nestjs/config';
import { costCalcDTO } from '../cost/types';
import { getTaxRes, sessionCloseDTO, sessionStartDTO } from '../session/types';
import { RateService } from '../rate/rate.service';

@Injectable()
export class ValidationService {
  private readonly local: string;
  private readonly weekends: string[];
  constructor(
    private readonly pgService: PgService,
    private readonly configService: ConfigService,
    private readonly rateService: RateService,
  ) {
    this.local = this.configService.get<string>('DATE_LOCAL');
    this.weekends = [
      this.configService.get<string>('DATE_WEEKEND1'),
      this.configService.get<string>('DATE_WEEKEND2'),
    ];
  }

  async validateForCost(dto: costCalcDTO, car) {
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
    const validCar = this.validateCarOnStart(car);
    if (typeof validCar == 'string') {
      return validCar;
    }
    if (
      (await this.validate3DaysRangeOnStart(validCar.id)) ===
      strCon.error.startLowPeriod
    ) {
      return strCon.error.startLowPeriod;
    }
    const validateAverageMileage = await this.validateAverageMileage(
      dto.date_start,
      dto.date_end,
      dto.mileagePerDay,
      true,
    );
    if (validateAverageMileage.message === strCon.error.closeOverTax) {
      return strCon.error.closeOverTax;
    }
    return strCon.success.start;
  }

  async validateForStart(dto: sessionStartDTO, car) {
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
    const validCar = this.validateCarOnStart(car);
    if (typeof validCar == 'string') {
      return validCar;
    }
    const carId = validCar.id;
    if (
      (await this.validate3DaysRangeOnStart(carId)) ===
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
    );
    if (
      validate30DaysLimitOnClose.message === strCon.error.close30DayLimitPassed
    ) {
      fineStatus[strCon.error.close30DayLimitPassed] =
        validate30DaysLimitOnClose.value;
    }
    const totalHours = this.getHours(
      currentSession.rows[0].date_start,
      dto.date_end,
    );
    const kmPerDay = this.getKmPerDay(totalHours, dto.mileage);
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

  async validate3DaysRangeOnStart(carId: number): Promise<string> {
    const lastCarSessions = await this.pgService.pg.query(
      `SELECT date_end FROM sessions WHERE car_id=${carId} ORDER BY date_end DESC LIMIT 1;`,
    );
    if (!lastCarSessions.rows.length) {
      return strCon.success.startDate3DayRange;
    }
    const now = new Date();
    const lastDateBooked = lastCarSessions.rows[0].date_end;
    const diff = Math.ceil(
      Math.floor(new Date(now).valueOf() - new Date(lastDateBooked).valueOf()) /
        36e5 /
        24,
    );
    if (diff >= 3) {
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

  validate30DaysLimitOnClose(startDate: Date, closeDate: Date) {
    const diff = Math.ceil(
      Math.floor(
        new Date(closeDate).valueOf() - new Date(startDate).valueOf(),
      ) /
        36e5 /
        24,
    );
    if (diff > 30) {
      return { message: strCon.error.close30DayLimitPassed, value: diff };
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
    let numToCompare = 500;
    if (rate_id) {
      const rate: getTaxRes = await this.rateService.getRateById(rate_id);
      numToCompare = rate !== 0 ? rate.cost : 500;
    }
    const totalHours = this.getHours(date_start, date_end);
    const kmPerDay = calc ? mileage : this.getKmPerDay(totalHours, mileage);
    if (kmPerDay <= numToCompare) {
      return { message: strCon.success.closeOverTax };
    } else {
      const diff = mileage - 30 * numToCompare;
      return { message: strCon.error.closeOverTax, value: diff };
    }
  }
  getHours(startDate: Date, endDate: Date): number {
    return (
      Math.floor(new Date(endDate).valueOf() - new Date(startDate).valueOf()) /
      36e5
    );
  }

  getDays(hours: number): number {
    return Math.ceil(hours / 24);
  }

  getKmPerDay(hours: number, total_km: number): number {
    const days = Math.ceil(hours / 24);
    return total_km / days;
  }
}

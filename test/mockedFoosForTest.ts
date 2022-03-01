import {
  getTaxRes,
  rateType,
  sessionCloseDTO,
  sessionStartDTO,
  sessionType,
} from '../src/session/types';
import {
  localeForTest,
  ratesForTest,
  sessionsForTest,
  weekendsForTest,
} from './mockedData';
import strCon from '../src/stringConsts';
import { carType, costCalcDTO } from '../src/cost/types';

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
    const rate: getTaxRes = ratesForTest.find(
      (it: rateType) => it.id === rate_id,
    );
    maxKm = !!rate ? rate.cost : 500;
  }
  const totalHours = calculationService.getHours(date_start, date_end);
  const days = calculationService.getDays(date_start, date_end);
  const kmPerDay = calc
    ? mileage
    : calculationService.getKmPerDay(totalHours, mileage);
  if (kmPerDay <= maxKm) {
    return { message: strCon.success.closeOverTax };
  } else {
    const diff = mileage - days * maxKm;
    return { message: strCon.error.closeOverTax, value: diff };
  }
}

function validateDateIsWeekendOnStart(date: Date): string {
  const isWeekend = weekendsForTest.find(
    (day: string) =>
      day ===
      new Date(date).toLocaleDateString(localeForTest, { weekday: 'long' }),
  );
  if (!!isWeekend) {
    return strCon.error.startOnWeekend;
  } else {
    return strCon.success.startDateNotWeekend;
  }
}

function validateDateIsWeekendOnClose(date: Date): string {
  const isWeekend = weekendsForTest.find(
    (day: string) =>
      day ===
      new Date(date).toLocaleDateString(localeForTest, { weekday: 'long' }),
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
  const sessionsForReduce: sessionType[] = sessionsForTest.filter(
    (it: sessionType) => it.car_id === carId,
  );
  if (!sessionsForReduce.length) {
    return strCon.success.startDate3DayRange;
  }
  const lastCarSession: sessionType = sessionsForReduce.reduce(function (r, a) {
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

function validateForCost(dto: costCalcDTO, car: carType): string {
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
  if (typeof errorOrValidCar == 'string') {
    return errorOrValidCar;
  }
  if (
    validate3DaysRangeOnStart(errorOrValidCar.id, dto.date_start) ===
    strCon.error.startLowPeriod
  ) {
    return strCon.error.startLowPeriod;
  }

  return strCon.success.start;
}
function getSessionsByRange(
  sessionsTestArr: sessionType[],
  dateStart: Date,
  dateEnd: Date,
  carId: number | null = null,
): sessionType[] {
  const sessions = !!carId
    ? sessionsTestArr.filter(
        (it: sessionType) =>
          ((it.date_start >= new Date(dateStart) &&
            it.date_start <= new Date(dateEnd)) ||
            (it.date_end >= new Date(dateStart) &&
              it.date_end <= new Date(dateEnd))) &&
          it.car_id === carId,
      )
    : sessionsTestArr.filter(
        (it: sessionType) =>
          (it.date_start >= new Date(dateStart) &&
            it.date_start <= new Date(dateEnd)) ||
          (it.date_end >= new Date(dateStart) &&
            it.date_end <= new Date(dateEnd)),
      );
  return sessions;
}
export {
  validateForStart,
  validateForClose,
  validateForCost,
  getSessionsByRange,
};

import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculationService {
  getDays(hours: number): number {
    return Math.ceil(hours / 24);
  }
  getHours(startDate: Date, endDate: Date): number {
    return (
      Math.floor(new Date(endDate).valueOf() - new Date(startDate).valueOf()) /
      36e5
    );
  }
  getDaysArray(startDate: Date, endDate: Date) {
    return this.getDates(startDate, endDate);
  }
  addDays(currentDate, days) {
    const date = new Date(currentDate.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  }
  getDates(startDate, stopDate) {
    const dateArray = [];
    let currentDate = new Date(startDate);
    while (currentDate <= new Date(stopDate)) {
      dateArray.push(new Date(currentDate));
      currentDate = this.addDays(currentDate, 1);
    }
    return dateArray;
  }
}

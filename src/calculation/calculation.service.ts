import { Injectable } from '@nestjs/common';

@Injectable()
export class CalculationService {
  getDays(startDate: Date, endDate: Date): number {
    const hours = this.getHours(startDate, endDate);
    return Math.ceil(hours / 24);
  }
  getHours(startDate: Date, endDate: Date): number {
    return (
      Math.floor(new Date(endDate).valueOf() - new Date(startDate).valueOf()) /
      36e5
    );
  }
  getDaysArray(startDate: Date, endDate: Date): Date[] {
    return this.getDates(startDate, endDate);
  }
  addDays(currentDate, days): Date {
    const date = new Date(currentDate.valueOf());
    date.setDate(date.getDate() + days);
    return date;
  }
  getDates(startDate, stopDate): Date[] {
    const dateArray = [];
    let currentDate = new Date(startDate);
    while (currentDate <= new Date(stopDate)) {
      dateArray.push(new Date(currentDate));
      currentDate = this.addDays(currentDate, 1);
    }
    return dateArray;
  }
  getKmPerDay(hours: number, total_km: number): number {
    const days = Math.ceil(hours / 24);
    return total_km / days;
  }
}

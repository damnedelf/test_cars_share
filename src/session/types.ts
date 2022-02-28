type sessionStartDTO = {
  car_id: number;
  date_start: Date;
  date_end: Date;
  rate_id: number;
};
type sessionCloseDTO = {
  mileage: number;
  date_end: Date;
  car_id: number;
};
type getTaxRes = {
  id: number;
  cost: number;
} | null;

type getDiscountRes = {
  id: number;
  discount_percent: number;
} | null;

type sessionType = {
  id: number;
  summ?: number;
  excess_days?: number;
  excess_km?: number;
  fine: boolean;
  date_start: Date;
  date_end?: Date;
  mileage?: number;
  car_id: number;
  tax_id: number;
  discount_id: number;
};
export {
  sessionCloseDTO,
  sessionStartDTO,
  getTaxRes,
  getDiscountRes,
  sessionType,
};

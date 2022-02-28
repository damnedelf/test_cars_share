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

type rateType = {
  id: number;
  cost: number;
  mileage: number;
};
type getDiscountRes = {
  id: number;
  discount_percent: number;
} | null;

type sessionType = {
  id: number;
  summ?: number;
  is_active: boolean;
  excess_days?: number;
  excess_km?: number;
  fine: boolean;
  date_start: Date;
  date_end?: Date;
  mileage?: number;
  car_id: number;
  rate_id: number;
  discount_id: number;
};
export {
  sessionCloseDTO,
  sessionStartDTO,
  getTaxRes,
  getDiscountRes,
  sessionType,
  rateType,
};

type costCalcDTO = {
  date_start: Date;
  date_end: Date;
  car_id: number;
  mileagePerDay: number;
};
type carType = {
  id: number;
  brand: string;
  model: string;
  vin: string;
  number: string;
  in_work: boolean;
};
export { costCalcDTO, carType };

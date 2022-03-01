import { carType } from '../src/cost/types';
import { discountType, rateType, sessionType } from '../src/session/types';

const carsForTest: carType[] = [
  {
    id: 1,
    brand: 'Lada',
    model: 'Vesta 1.6',
    vin: '4Y1SL65848Z411439',
    number: 'A123BC 111RUS',
    in_work: true,
  },
  {
    id: 2,
    brand: 'KIA',
    model: 'Soul 2.0',
    vin: '4Y1SL65848Z411438',
    number: 'A456BC 121RUS',
    in_work: false,
  },
  {
    id: 3,
    brand: 'HONDA',
    model: 'CRV 2.4',
    vin: '4Y1SL65848Z411437',
    number: 'A789BC 131RUS',
    in_work: false,
  },
  {
    id: 4,
    brand: 'HYUNDAI',
    model: 'GETZ 1.1',
    vin: '4Y1SL65848Z411436',
    number: 'A012BC 141RUS',
    in_work: false,
  },
  {
    id: 5,
    brand: 'GEELY',
    model: 'ATLAS 2.4',
    vin: '4Y1SL65848Z411435',
    number: 'A345BC 151RUS',
    in_work: false,
  },
];

const sessionsForTest: sessionType[] = [
  {
    id: 1,
    is_active: false,
    summ: 5000,
    excess_days: 0,
    excess_km: 0,
    fine: false,
    date_start: new Date('2022-02-01'),
    date_end: new Date('2022-02-10'),
    mileage: 500,
    car_id: 1,
    rate_id: 2,
    discount_id: 3,
  },
  {
    id: 2,
    is_active: false,
    summ: 1000,
    excess_days: 0,
    excess_km: 0,
    fine: false,
    date_start: new Date('2022-02-14'),
    date_end: new Date('2022-02-28'),
    mileage: 3000,
    car_id: 1,
    rate_id: 1,
    discount_id: 2,
  },
  {
    id: 3,
    is_active: false,
    summ: 1333,
    excess_days: 0,
    excess_km: 7000,
    fine: true,
    date_start: new Date('2022-02-01'),
    date_end: new Date('2022-02-03'),
    mileage: 8000,
    car_id: 2,
    rate_id: 3,
    discount_id: 0,
  },
  {
    id: 4,
    is_active: false,
    summ: 6666,
    excess_days: 0,
    excess_km: 0,
    fine: false,
    date_start: new Date('2022-02-19'),
    date_end: new Date('2022-02-24'),
    mileage: 1000,
    car_id: 2,
    rate_id: 2,
    discount_id: 3,
  },
  {
    id: 5,
    is_active: true,
    summ: 0,
    excess_days: 0,
    excess_km: 0,
    fine: false,
    date_start: new Date('2022-02-19'),
    date_end: new Date('2022-02-24'),
    mileage: 0,
    car_id: 4,
    rate_id: 2,
    discount_id: 0,
  },
];

const weekendsForTest: string[] = ['воскресенье', 'суббота'];
const localeForTest = 'ru-RU';
const ratesForTest: rateType[] = [
  {
    id: 1,
    cost: 270,
    mileage: 200,
  },
  {
    id: 2,
    cost: 330,
    mileage: 350,
  },
  {
    id: 3,
    cost: 390,
    mileage: 500,
  },
];
const discountsForTest: discountType[] = [
  { id: 1, min: 3, max: 5, discount_percent: 5 },
  { id: 2, min: 6, max: 14, discount_percent: 10 },
  { id: 3, min: 15, max: 30, discount_percent: 15 },
];

export {
  carsForTest,
  sessionsForTest,
  weekendsForTest,
  localeForTest,
  discountsForTest,
  ratesForTest,
};

import { sessionType } from '../session/types';

type statsDTO = {
  date_end: Date;
  date_start: Date;
  car_id?: number;
};
type statsRes = {
  [key: string]: sessionType[];
};

export { statsDTO, statsRes };

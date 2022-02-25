import { Injectable } from '@nestjs/common';
import { CalculationService } from '../calculation/calculation.service';
import { PgService } from '../pg/pg.service';
import { SessionService } from '../session/session.service';
import { statsDTO } from './types';
import { sessionType } from '../session/types';

@Injectable()
export class StatsService {
  constructor(
    private readonly pgService: PgService,
    private readonly calculationService: CalculationService,
    private readonly sessionService: SessionService,
  ) {}

  async carsStats(dto: statsDTO) {
    const stats = [];
    const dates: any = this.calculationService.getDaysArray(
      dto.date_start,
      dto.date_end,
    );
    const sessions: sessionType[] = await this.sessionService.getAllSessions();
    if (dates.length > 0) {
      dates.forEach((date) => {
        if (sessions) {
          sessions.forEach((session: sessionType) => {
            const time1 = new Date(date).getTime();
            const timeS = new Date(session.date_start).getTime();
            const timeE = new Date(session.date_end).getTime();
            const condition = dto.car_id
              ? session.car_id === dto.car_id * 1 &&
                time1 >= timeS &&
                time1 <= timeE
              : time1 >= timeS && time1 <= timeE;
            if (condition) {
              const statObj = {};
              statObj[date] = [];
              statObj[date].push(session);
              stats.push(statObj);
            }
          });
        }
      });
    }
    return stats;
  }
}

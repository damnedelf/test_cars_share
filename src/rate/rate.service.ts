import { Injectable } from '@nestjs/common';
import { PgService } from '../pg/pg.service';
import { getTaxRes } from '../session/types';

@Injectable()
export class RateService {
  constructor(private readonly pgService: PgService) {}

  async getRateByKm(km: number): Promise<getTaxRes> {
    const rate = await this.pgService.pg.query(
      'SELECT cost,id FROM rates WHERE mileage >= $1 LIMIT 1;',
      [km],
    );

    return rate.rows[0]?.id ? rate.rows[0] : null;
  }

  async getRateById(id: number): Promise<getTaxRes> {
    const rate = await this.pgService.pg.query(
      'SELECT cost,id FROM rates WHERE id = $1;',
      [id],
    );
    return rate.rows[0];
  }
}

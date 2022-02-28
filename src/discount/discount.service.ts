import { Injectable } from '@nestjs/common';
import { PgService } from '../pg/pg.service';
import { getDiscountRes } from '../session/types';

@Injectable()
export class DiscountService {
  constructor(private readonly pgService: PgService) {}

  async getDiscount(days: number): Promise<getDiscountRes> {
    const discount = await this.pgService.pg.query(
      `SELECT discount_percent,id FROM discounts WHERE 
        $1 >=min AND 
        $1 <= max LIMIT 1;`,
      [days],
    );
    return discount.rows[0]?.id ? discount.rows[0] : null;
  }
}

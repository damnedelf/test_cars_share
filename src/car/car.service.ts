import { Injectable } from '@nestjs/common';
import { PgService } from '../pg/pg.service';
import { QueryResult } from 'pg';

@Injectable()
export class CarService {
  constructor(private readonly pgService: PgService) {}
  async getCar(id: number): Promise<QueryResult> {
    return await this.pgService.pg.query(
      'SELECT * FROM cars WHERE id=$1 LIMIT 1;',
      [id],
    );
  }
  async getFreeCar(id: number): Promise<QueryResult> {
    return await this.pgService.pg.query(
      'SELECT * FROM cars WHERE id=$1 and in_work=false LIMIT 1;',
      [id],
    );
  }

  async startWork(carId: number): Promise<void> {
    await this.pgService.pg.query(
      'UPDATE cars SET in_work = true WHERE id=$1;',
      [carId],
    );
  }

  async stopWork(carId: number): Promise<void> {
    await this.pgService.pg.query(
      'UPDATE cars SET in_work = false   WHERE id=$1;',
      [carId],
    );
  }
}

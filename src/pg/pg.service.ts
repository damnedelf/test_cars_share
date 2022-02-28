import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PgService {
  public readonly pg;

  constructor(private configService: ConfigService) {
    this.pg = new Pool({
      user: this.configService.get<string>('DB_USER'),
      host: this.configService.get<string>('DB_USER'),
      database: this.configService.get<string>('DB_NAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
    });
  }

  request() {
    return this.pg;
  }
}

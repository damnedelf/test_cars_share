import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PgService {
  public readonly pg;

  constructor(private configService: ConfigService) {
    this.pg = new Pool({
      user: this.configService.get<string>('DB_USER'),
      host: this.configService.get<string>('DB_HOST'),
      database: this.configService.get<string>('DB_NAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      port: parseInt(this.configService.get<string>('DB_PORT')),
    });
  }

  request() {
    return this.pg;
  }
}

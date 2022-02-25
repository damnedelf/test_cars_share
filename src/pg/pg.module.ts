import { Module } from '@nestjs/common';
import { PgService } from './pg.service';
import {ConfigModule} from "@nestjs/config";

@Module({
  imports:[ConfigModule],
  providers: [PgService],
  exports:[PgService]
})
export class PgModule {}

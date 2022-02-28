import { Body, Controller, Response, Post, Put } from '@nestjs/common';
import { SessionService } from './session.service';
import { sessionCloseDTO, sessionStartDTO } from './types';
import strCon from '../stringConsts';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  async start(@Body() dto: sessionStartDTO, @Response() res) {
    const result = await this.sessionService.start(dto);
    if (result === strCon.success.start) {
      res.status(201);
    } else {
      res.status(409);
    }
    res.send(result);
  }

  @Put()
  async close(@Body() dto: sessionCloseDTO, @Response() res) {
    const result = await this.sessionService.close(dto);
    if (result === strCon.success.close) {
      res.status(200);
    } else {
      res.status(409);
    }
    res.send(result);
  }
}

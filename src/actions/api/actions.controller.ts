import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { OutboxWriter } from 'src/outbox/outbox.writer';
import { ActionTypes } from '../actions.types';
import { ActionDto } from './action.dto';

import { ActionsGuard } from './actions.api.guard';

@Controller('actions')
@UseGuards(ActionsGuard)
export class ActionsController {
  constructor(private outbox: OutboxWriter) {}

  @Post()
  async post<TKey extends ActionTypes>(
    @Body() action: ActionDto<TKey>,
  ): Promise<any> {
    await this.outbox.write({
      type: 'outbox:action',
      value: {
        action: action.payload,
      },
    });
    return {};
  }
}

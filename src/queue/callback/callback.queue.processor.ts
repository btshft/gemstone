import { Process, Processor } from '@nestjs/bull';
import { InjectBot } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { S3 } from 'src/s3/s3.store';
import { Telegraf } from 'telegraf';
import { CALLBACK_QUEUE } from './callback.queue.constants';
import { CallbackJob, CALLBACK_STORIES_REQ_READY } from './callback.types';

@Processor(CALLBACK_QUEUE)
export class CallbackQueueProcessor {
  constructor(@InjectBot() private tg: Telegraf<BotContext>, private s3: S3) {}

  @Process(CALLBACK_STORIES_REQ_READY)
  async storiesReqReady(job: CallbackJob<'stories:req:ready'>) {}
}

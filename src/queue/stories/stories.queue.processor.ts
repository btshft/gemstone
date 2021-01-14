import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectBot } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { Telegraf } from 'telegraf';
import { StoriesQueue } from './stories.queue';
import { STORIES_QUEUE } from './stories.queue.constants';
import { StoriesRequest } from './stories.queue.request';

@Processor(STORIES_QUEUE)
export class StoriesQueueProcessor {
  constructor(
    @InjectBot() private bot: Telegraf<BotContext>,
    private queue: StoriesQueue,
  ) {}

  @Process()
  async process(job: Job<StoriesRequest>): Promise<void> {
    const { ig, tg } = job.data;
    this.queue.complete(tg.chatId, tg.userId, job.id);
  }
}

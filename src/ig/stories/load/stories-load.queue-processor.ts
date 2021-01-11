import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectBot } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import Telegraf from 'telegraf';
import { STORIES_LOAD_QUEUE } from './stories-load.constants';
import { LoadStoriesRequest } from './stories-load.message';

@Processor(STORIES_LOAD_QUEUE)
export class StoriesLoadProcessor {
  constructor(@InjectBot() private bot: Telegraf<BotContext>) {}

  @Process()
  async process(job: Job<LoadStoriesRequest>): Promise<void> {
    await this.bot.telegram.sendMessage(job.data.tg.chat.id, 'Hello there');
  }
}

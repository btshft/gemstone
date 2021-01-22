import { BotContext } from 'src/bot/bot.context';
import {
  CreateFavoriteGetStories,
  FavoritesService,
} from 'src/favorites/favorites.service';
import { StoriesRequester } from '../services/stories.requester';

export class ProfileDialog {
  constructor(
    private readonly requester: StoriesRequester,
    private readonly favoritesService: FavoritesService,
    private readonly userId: string,
    private readonly username: string,
    private readonly handle: number,
    public readonly id: number,
  ) {}

  async favorite(bot: BotContext): Promise<void> {
    const model: CreateFavoriteGetStories = {
      alias: `@${this.username} stories`,
      parameters: {
        userId: this.userId.toLowerCase(),
        username: this.username.toLocaleLowerCase(),
      },
      type: 'favories:get:stories',
      userId: bot.app.user.id,
    };

    const exists = await this.favoritesService.exists(
      model.userId,
      model.parameters,
    );

    if (exists) {
      await bot.reply(`User @${this.username} is already in your favorites 👾`);
      return;
    }

    await this.favoritesService.add(model);
    await bot.reply(`User @${this.username} was added to your favorites ⚡️`);

    return;
  }

  async close(bot: BotContext): Promise<void> {
    await bot.deleteMessage(this.handle);
  }

  async stories(bot: BotContext): Promise<void> {
    await this.requester.requestStories(bot, this.userId, this.username);
  }

  async followersInsight(bot: BotContext): Promise<void> {
    await this.requester.requestFollowersInsight(
      bot,
      this.userId,
      this.username,
    );
  }
}

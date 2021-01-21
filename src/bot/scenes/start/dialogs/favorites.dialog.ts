import { BotContext } from 'src/bot/bot.context';
import {
  FavoriteGetStories,
  FavoritesService,
} from 'src/favorites/favorites.service';
import { StoriesRequester } from '../services/stories.requester';

export class FavoritesDialog {
  constructor(
    private readonly favorites: FavoritesService,
    private readonly requester: StoriesRequester,
    private readonly handle: number,
    public readonly id: number,
  ) {}

  async close(bot: BotContext): Promise<void> {
    await bot.deleteMessage(this.handle);
  }

  async execute(id: string, bot: BotContext): Promise<void> {
    const favorite = await this.favorites.getById(id);
    if (!favorite) {
      return;
    }

    if (favorite.type === 'favories:get:stories') {
      const {
        parameters: { userId, username },
      } = <FavoriteGetStories>favorite;

      await this.requester.requestStories(bot, userId, username);
    }
  }
}

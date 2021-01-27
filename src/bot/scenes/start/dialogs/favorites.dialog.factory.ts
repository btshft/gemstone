import { Injectable } from '@nestjs/common';
import { BotContext } from 'src/bot/bot.context';
import { FavoritesService } from 'src/favorites/favorites.service';
import { indexed } from 'src/utils/helpers';
import { FavoritesDialog } from './favorites.dialog';
import { StoriesRequester } from '../services/stories.requester';
import { InlineKeyboardButton } from 'telegraf/typings/telegram-types';
import { Markup } from 'telegraf';

@Injectable()
export class FavoritesDialogFactory {
  private dialogIdGen = 0;

  constructor(
    private readonly favorites: FavoritesService,
    private readonly requester: StoriesRequester,
  ) {}

  async create(bot: BotContext): Promise<FavoritesDialog | undefined> {
    const {
      app: { user },
    } = bot;

    const favorites = await this.favorites.get(user.id);
    if (!favorites.length) {
      await bot.reply(
        "You have no favorites yet. Maybe it's time to add something? 🤔",
      );
      return undefined;
    }

    const dialogId = ++this.dialogIdGen;
    const buttons: InlineKeyboardButton[] = [];
    for (const { value: favorite } of indexed(favorites)) {
      buttons.push(
        Markup.button.callback(
          favorite.alias,
          `dialog:favorites:${dialogId}:${favorite.id}`,
        ),
      );
    }

    buttons.push(
      Markup.button.callback('Close', `dialog:favorites:close:${dialogId}`),
    );

    const wh = bot.telegram.webhookReply;

    try {
      bot.telegram.webhookReply = false;

      const { message_id } = await bot.reply(
        "Here's your favorites 🍋",
        Markup.inlineKeyboard(buttons, { columns: 1 }),
      );

      return new FavoritesDialog(
        this.favorites,
        this.requester,
        message_id,
        dialogId,
      );
    } finally {
      bot.telegram.webhookReply = wh;
    }
  }
}

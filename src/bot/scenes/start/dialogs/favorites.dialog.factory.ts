import { Injectable } from '@nestjs/common';
import { BotContext } from 'src/bot/bot.context';
import { FavoritesService } from 'src/favorites/favorites.service';
import { indexed } from 'src/utils/helpers';
import { Extra } from 'telegraf';
import { Markup } from 'telegraf';
import { InlineKeyboardButton } from 'telegraf/typings/markup';
import { FavoritesDialog } from './favorites.dialog';
import { StoriesRequester } from '../services/stories.requester';

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
        Markup.callbackButton(
          favorite.alias,
          `dialog:favorites:${dialogId}:${favorite.id}`,
        ),
      );
    }

    buttons.push(
      Markup.callbackButton('Close', `dialog:favorites:close:${dialogId}`),
    );

    const wh = bot.telegram.webhookReply;

    try {
      bot.telegram.webhookReply = false;

      const { message_id } = await bot.reply(
        "Here's your favorites 🍋",
        Extra.markup(Markup.inlineKeyboard(buttons, { columns: 1 }).resize()),
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

import { Injectable } from '@nestjs/common';
import { BotContext } from 'src/bot/bot.context';
import { FavoritesService } from 'src/favorites/favorites.service';
import { IgService } from 'src/ig/ig.service';
import { Extra } from 'telegraf';
import { Markup } from 'telegraf';
import { ProfileDialog } from './profile.dialog';
import { StoriesRequester } from '../services/stories.requester';

@Injectable()
export class ProfileDialogFactory {
  private dialogIdGen = 0;

  constructor(
    private readonly ig: IgService,
    private readonly favorites: FavoritesService,
    private readonly requester: StoriesRequester,
  ) {}

  async create(
    bot: BotContext,
    username: string,
  ): Promise<ProfileDialog | undefined> {
    if (!username) {
      return undefined;
    }

    const userId = await this.ig.userId(username);
    if (!userId) {
      return undefined;
    }

    const userInfo = await this.ig.userInfo(userId);
    if (userInfo && userInfo.is_private) {
      await bot.reply(`Sorry, @${username} profile is private, can't help.`);
      return undefined;
    }

    const id = ++this.dialogIdGen;
    const wh = bot.telegram.webhookReply;

    try {
      bot.telegram.webhookReply = false;
      const { message_id } = await bot.reply(
        `What you want to do with @${username}? 😈`,
        Extra.markup(
          Markup.inlineKeyboard(
            [
              Markup.callbackButton('Stories', `dialog:profile:stories:${id}`),
              Markup.callbackButton(
                'Add to favorites',
                `dialog:profile:favorites:${id}`,
              ),
              Markup.callbackButton(
                'Followers insight',
                `dialog:profile:followers:insight:${id}`,
              ),
              Markup.callbackButton('Close', `dialog:profile:close:${id}`),
            ],
            { columns: 1 },
          ).resize(),
        ),
      );

      return new ProfileDialog(
        this.requester,
        this.favorites,
        String(userId),
        username,
        message_id,
        id,
      );
    } finally {
      bot.telegram.webhookReply = wh;
    }
  }
}

import { UseGuards } from '@nestjs/common';
import { Action, Ctx, Hears, Scene } from 'nestjs-telegraf';
import { BotContext, cbQuery, message } from 'src/bot/bot.context';
import { Role } from 'src/bot/security/bot.role.guard';
import { TtService } from 'src/tt/tt.service';
import { ADMINISTRATION_SCENE } from '../administration/administration.scene';
import { FavoritesDialog } from './dialogs/favorites.dialog';
import { FavoritesDialogFactory } from './dialogs/favorites.dialog.factory';
import { ProfileDialog } from './dialogs/profile.dialog';
import { ProfileDialogFactory } from './dialogs/profile.dialog.factory';
import { TtRequester, TT_SHORTURL_REGEXP } from './services/tt.requester';

export const START_SCENE = 'START_SCENE';

const IG_URL_REGEXP = /^(http(s)?:\/\/)?(www\.)?instagram\.com\/(?<username>[a-zA-Z0-9._]{4,})(\?.*)?(\/.*)?$/i;
const IG_MENTION_REGEXP = /^@(?<username>[a-zA-Z0-9._]{4,})$/i;
const IG_REGEXP = /^(?<username>[a-zA-Z0-9._]{4,})$/i;

const ACTION_PROFILE_STORIES_REGEXP = /^dialog:profile:stories:(?<id>.+)$/i;
const ACTION_PROFILE_CLOSE_REGEXP = /^dialog:profile:close:(?<id>.+)$/i;
const ACTION_PROFILE_FAVORITE_REGEXP = /^dialog:profile:favorites:(?<id>.+)$/i;
const ACTION_PROFILE_FOLLOWERS_INSIGHT_REGEXP = /^dialog:profile:followers:insight:(?<id>.+)$/i;

const ACTION_FAVORITES_EXECUTE_REGEXP = /^dialog:favorites:(?<dialog>.*):(?<id>.*)$/i;
const ACTION_FAVORITES_CLOSE_REGEXP = /^dialog:favorites:close:(?<dialog>.*)$/i;

@Scene(START_SCENE)
@UseGuards(Role('*'))
export class StartScene {
  constructor(
    private readonly profileDialog: ProfileDialogFactory,
    private readonly favoritesDialog: FavoritesDialogFactory,
    private readonly ttService: TtService,
    private readonly ttRequester: TtRequester,
  ) {}

  @Hears('Administration')
  @UseGuards(Role('Administrator'))
  async administration(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    await router.navigate(ADMINISTRATION_SCENE);
  }

  @Hears('Favorites')
  async favorites(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const dialog = await this.favoritesDialog.create(bot);
    if (dialog) {
      router.state({
        favorites: {
          [dialog.id]: dialog,
        },
      });
    }
  }

  @Hears(TT_SHORTURL_REGEXP)
  async $hears_tiktok(@Ctx() bot: BotContext): Promise<void> {
    const url = message(bot).text;
    await this.ttRequester.request(url, bot);
  }

  @Hears(IG_MENTION_REGEXP)
  async $hears_mention(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const { username } = message(bot).text.match(IG_MENTION_REGEXP).groups;
    const dialog = await this.profileDialog.create(bot, username);

    if (dialog) {
      router.state({
        profiles: {
          [dialog.id]: dialog,
        },
      });
    }
  }

  @Hears(IG_URL_REGEXP)
  async $hears_url(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const { username } = message(bot).text.match(IG_URL_REGEXP).groups;
    const dialog = await this.profileDialog.create(bot, username);

    if (dialog) {
      router.state({
        profiles: {
          [dialog.id]: dialog,
        },
      });
    }
  }

  @Hears(IG_REGEXP)
  async $hears_username(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const { username } = message(bot).text.match(IG_REGEXP).groups;
    const dialog = await this.profileDialog.create(bot, username);

    if (dialog) {
      router.state({
        profiles: {
          [dialog.id]: dialog,
        },
      });
    }
  }

  @Action(ACTION_PROFILE_STORIES_REGEXP)
  async $stories(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const { profiles } = router.state();
    const { id } = cbQuery(bot).data.match(
      ACTION_PROFILE_STORIES_REGEXP,
    ).groups;

    if (profiles && profiles[id]) {
      const dialog: ProfileDialog = profiles[id];

      await dialog.stories(bot);
      await bot.answerCbQuery();
    }
  }

  @Action(ACTION_PROFILE_FAVORITE_REGEXP)
  async $favorite(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const { profiles } = router.state();
    const { id } = cbQuery(bot).data.match(
      ACTION_PROFILE_FAVORITE_REGEXP,
    ).groups;

    if (profiles && profiles[id]) {
      const dialog: ProfileDialog = profiles[id];

      await dialog.favorite(bot);
      await bot.answerCbQuery();
    }
  }

  @Action(ACTION_PROFILE_FOLLOWERS_INSIGHT_REGEXP)
  async $followersInsight(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const { profiles } = router.state();
    const { id } = cbQuery(bot).data.match(
      ACTION_PROFILE_FOLLOWERS_INSIGHT_REGEXP,
    ).groups;

    if (profiles && profiles[id]) {
      const dialog: ProfileDialog = profiles[id];

      await dialog.followersInsight(bot);
      await bot.answerCbQuery();
    }
  }

  @Action(ACTION_PROFILE_CLOSE_REGEXP)
  async $close(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const { profiles } = router.state();
    const { id } = cbQuery(bot).data.match(ACTION_PROFILE_CLOSE_REGEXP).groups;

    if (profiles && profiles[id]) {
      const dialog: ProfileDialog = profiles[id];

      await dialog.close(bot);
      await bot.answerCbQuery();

      delete profiles[id];
    }
  }

  @Action(ACTION_FAVORITES_CLOSE_REGEXP)
  async $closeFavorite(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const { favorites } = router.state();
    const { dialog } = cbQuery(bot).data.match(
      ACTION_FAVORITES_CLOSE_REGEXP,
    ).groups;

    if (favorites && favorites[dialog]) {
      const dialogRef: FavoritesDialog = favorites[dialog];
      await dialogRef.close(bot);
      await bot.answerCbQuery();

      delete favorites[dialog];
    }
  }

  @Action(ACTION_FAVORITES_EXECUTE_REGEXP)
  async $executeFavorite(@Ctx() bot: BotContext): Promise<void> {
    const { router } = bot;
    const { favorites } = router.state();
    const { id, dialog } = cbQuery(bot).data.match(
      ACTION_FAVORITES_EXECUTE_REGEXP,
    ).groups;

    if (favorites && favorites[dialog]) {
      const dialogRef: FavoritesDialog = favorites[dialog];
      await dialogRef.execute(id, bot);
      await bot.answerCbQuery();
    }
  }
}

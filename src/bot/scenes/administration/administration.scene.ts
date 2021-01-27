import { UseGuards } from '@nestjs/common';
import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { BotContext } from 'src/bot/bot.context';
import { Role } from 'src/bot/security/bot.role.guard';
import { IgService } from 'src/ig/ig.service';
import { UserService } from 'src/user/user.service';
import { Markup } from 'telegraf';
import { ADMINISTRATION_CHALLENGE_SCENE } from './administration.challenge.scene';
import { ADMINISTRATION_STATE_SCENE } from './administration.state.scene';

export const ADMINISTRATION_SCENE = 'ADMINISTRATION_SCENE';

const ACTIONS = {
  Login: 'action:administration:login',
  Challenge: 'action:administration:challenge',
  State: 'action:administration:state',
  IssueToken: 'action:administration:issue-token',
  Back: 'action:administration:back',
};

@Scene(ADMINISTRATION_SCENE)
@UseGuards(Role('Administrator'))
export class AdministrationScene {
  constructor(private ig: IgService, private userService: UserService) {}

  @SceneEnter()
  async enter(@Ctx() ctx: BotContext): Promise<void> {
    const { ui } = ctx;
    const message = `Select option`;
    const buttons = [
      Markup.button.callback('Login', ACTIONS.Login),
      Markup.button.callback('Challenge', ACTIONS.Challenge),
      Markup.button.callback('State', ACTIONS.State),
      Markup.button.callback('Issue token', ACTIONS.IssueToken),
      Markup.button.callback('Back', ACTIONS.Back),
    ];

    await ui.render(message, Markup.inlineKeyboard(buttons, { columns: 2 }));
  }

  @Action(ACTIONS.Back)
  async back(@Ctx() ctx: BotContext): Promise<void> {
    const { router, ui } = ctx;
    await ui.destroy();
    await router.return({}, { silent: true });
  }

  @Action(ACTIONS.Login)
  async login(@Ctx() ctx: BotContext): Promise<void> {
    const { ui } = ctx;
    const status = await this.ig.authenticate();

    await ui.popup(`Login ${status}`);
  }

  @Action(ACTIONS.Challenge)
  async challenge(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    await router.navigate(ADMINISTRATION_CHALLENGE_SCENE);
  }

  @Action(ACTIONS.State)
  async state(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    await router.navigate(ADMINISTRATION_STATE_SCENE);
  }

  @Action(ACTIONS.IssueToken)
  async issueToken(@Ctx() ctx: BotContext): Promise<void> {
    const { router } = ctx;
    const token = await this.userService.issueRegistrationToken(['User']);

    await ctx.replyWithHTML(
      `Token: <code>${token}</code>\nLink: <a href="">https://t.me/${ctx.me}?start=${token}</a>`,
    );
    await router.navigate(ADMINISTRATION_SCENE);
  }
}

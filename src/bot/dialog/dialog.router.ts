import { reverse } from 'src/utils/helpers';
import { TObject } from 'src/utils/utility.types';
import { MiddlewareFn } from 'telegraf';
import { BotContext } from '../bot.context';

export type ReturnOptions = {
  silent: boolean;
};

export type NavigateOptions = {
  silent: boolean;
};

export class DialogRouter {
  constructor(private readonly bot: BotContext) {}

  public async return<TState extends TObject = TObject>(
    state?: TState,
    options?: Partial<ReturnOptions>,
  ): Promise<void> {
    const { scene } = this.bot;
    const history = this.scenes();
    const [active, previous] = reverse(history);

    if (!active && !previous) {
      throw new Error(`No dialog to return`);
    }

    await scene.leave();
    this.flush(active);

    history.pop();
    this.scenes([...history]);

    if (state && previous) {
      this.state(state, previous);
    }

    const silent = options?.silent ?? false;
    await scene.enter(previous, scene, silent);
    try {
      await this.bot.answerCbQuery();
    } catch {}
  }

  public async navigate<TState extends TObject = TObject>(
    scene: string,
    state?: TState,
    options?: Partial<NavigateOptions>,
  ): Promise<void> {
    const { scene: control } = this.bot;
    const history = this.scenes();
    const [active] = reverse(history);

    if (active) {
      await control.leave();
      this.flush(active);
    }

    this.scenes([...history, scene]);
    if (state) {
      this.state(state, scene);
    }

    const silent = options?.silent ?? false;
    await control.enter(scene, state, silent);
    try {
      await this.bot.answerCbQuery();
    } catch {}
  }

  public state<T extends TObject>(update?: Partial<T>, scene?: string): T {
    const [active] = reverse(this.scenes());
    const key = `__dialog_router_scene_state_${this.bot.chat.id}__${
      scene || active
    }`;

    const state = this.bot.session[key] || {};

    if (update) {
      this.bot.session[key] = {
        ...state,
        ...update,
      };
    }

    return state;
  }

  private flush(scene?: string): void {
    const [active] = reverse(this.scenes());
    const key = `__dialog_router_scene_state_${this.bot.chat.id}__${
      scene || active
    }`;

    this.bot.session[key] = {};
  }

  private scenes(update?: string[]): string[] {
    const key = `__dialog_router__${this.bot.chat.id}`;
    const current = this.bot.session[key] || [];

    if (!update) {
      return current;
    }

    this.bot.session[key] = update;
    return update;
  }
}

export function router(): MiddlewareFn<BotContext> {
  return async function (ctx, next) {
    if (!ctx.router) {
      ctx.router = new DialogRouter(ctx);
    }
    return await next();
  };
}

/* eslint-disable @typescript-eslint/ban-types */

import { SceneContextMessageUpdate } from 'telegraf/typings/stage';
import { ExtraEditMessage } from 'telegraf/typings/telegram-types';

export type SceneState<T extends object> = T & {
  previousState?: string;
};

export type TransitionOptions<T extends object> = Partial<{
  state: SceneState<T>;
  complete: boolean;
  dropHistory: boolean;
}>;

export class SceneRouter {
  constructor(private context: BotContext) {}

  static wrap(context: BotContext): SceneRouter {
    return new SceneRouter(context);
  }

  public state<T extends object>(): SceneState<T> {
    return <SceneState<T>>this.context.scene.state;
  }

  public async return<T extends object>(
    options?: TransitionOptions<T>,
  ): Promise<any> {
    if (!this.scenes.length) throw new Error('There is no scene to return');

    const currentScene = this.scenes.pop();

    // eslint-disable-next-line prettier/prettier
    const returnScene = this.scenes.length > 0
        ? this.scenes[this.scenes.length - 1]
        : undefined;

    if (options?.complete) {
      await this.context.answerCbQuery();
    }

    await this.context.scene.leave();
    if (returnScene) {
      const state: SceneState<T> = {
        ...options?.state,
        previousState: options?.dropHistory ? undefined : currentScene,
      };

      await this.context.scene.enter(returnScene, state);
    }

    if (options?.dropHistory) this.scenes = [];
  }

  public async navigate<T extends object>(
    scene: string,
    options?: TransitionOptions<T>,
  ): Promise<any> {
    if (options?.complete) {
      await this.context.answerCbQuery();
    }

    if (this.scenes.length) {
      await this.context.scene.leave();
    }

    const currentScene = this.scenes.length
      ? this.scenes[this.scenes.length - 1]
      : undefined;

    const state: SceneState<T> = {
      ...options?.state,
      previousState: options?.dropHistory ? undefined : currentScene,
    };

    await this.context.scene.enter(scene, state);
    this.scenes = options?.dropHistory ? [scene] : [...this.scenes, scene];
  }

  public async reply(text: string, extra?: ExtraEditMessage): Promise<void> {
    const state = this.state();
    if (state.previousState) {
      await this.context.editMessageText(text, extra);
    } else {
      await this.context.reply(text, extra);
    }
  }

  private get scenes(): string[] {
    return this.context.session[`sc${this.context.chat.id}`] || [];
  }

  private set scenes(scenes: string[]) {
    this.context.session[`sc${this.context.chat.id}`] = [...scenes];
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BotContext extends SceneContextMessageUpdate {
  session: any;
}

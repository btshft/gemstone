import { reverse } from 'src/utils/helpers';
import { TObject } from 'src/utils/utility.types';
import { Markup } from 'telegraf';
import { MiddlewareFn } from 'telegraf/typings/composer';
import { InlineKeyboardButton } from 'telegraf/typings/markup';
import {
  ExtraEditMessage,
  ExtraReplyMessage,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from 'telegraf/typings/telegram-types';
import { BotContext } from '../bot.context';

type DialogWizardState = {
  dialog?: {
    message: string;
    handle: number;
    markup: InlineKeyboardMarkup;
  };
  scenes?: Array<string>;
};

type NavigateOptions = {
  fromDialog: boolean;
  silent: boolean;
};

type ReturnOptions = {
  fallback: string;
  silent: boolean;
};

type KeyboardMarkupRef = {
  reply_markup:
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove;
};

type DialogOptions = Omit<
  ExtraReplyMessage,
  keyof Pick<ExtraReplyMessage, 'reply_markup' | 'reply_to_message_id'>
> & {
  recreate: boolean;
};

export function wizard(): MiddlewareFn<BotContext> {
  return async function (ctx, next) {
    if (!ctx.dialog) {
      ctx.dialog = new DialogWizard(ctx);
    }
    return await next();
  };
}

export class DialogWizard {
  constructor(private context: BotContext) {}

  async return(): Promise<void>;
  async return<TState extends TObject>(state: TState): Promise<void>;
  async return(options: Partial<ReturnOptions>): Promise<void>;

  async return<TState extends TObject>(
    state?: TState,
    options?: Partial<ReturnOptions>,
  ): Promise<void> {
    const { scenes } = this.internalState();
    const [activeScene, previousScene] = reverse(scenes);
    const { silent, fallback } = options || { silent: false };
    const { scene } = this.context;

    if (!activeScene) {
      if (!previousScene || !fallback) throw new Error(`No dialog to return`);
    }

    await scene.leave();

    scenes.pop();
    this.internalState({
      scenes: scenes,
    });

    if (state && previousScene) {
      this.state(state, previousScene);
    }

    await scene.enter(previousScene || fallback, state, silent);
  }

  async navigate(scene: string): Promise<void>;

  async navigate<TState extends TObject>(
    scene: string,
    state: TState,
  ): Promise<void>;

  async navigate(
    scene: string,
    options: Partial<NavigateOptions>,
  ): Promise<void>;

  async navigate<TState extends TObject>(
    scene: string,
    state?: TState,
    options?: Partial<NavigateOptions>,
  ): Promise<void> {
    const { fromDialog, silent } = options || {
      fromDialog: true,
      silent: false,
    };
    const { scenes } = this.internalState();
    const [, activeScene] = scenes;
    if (activeScene) {
      await this.context.scene.leave();
    }

    if (fromDialog) {
      await this.completeQuery();
    }

    this.internalState({
      scenes: [...scenes, scene],
    });

    if (state) {
      this.state(state, scene);
    }

    await this.context.scene.enter(scene, state, silent);
  }

  async answer(text: string): Promise<void> {
    try {
      await this.context.answerCbQuery(text);
    } catch {}
  }

  async ui(): Promise<void>;

  async ui(
    message: string,
    markup: KeyboardMarkupRef | InlineKeyboardMarkup | InlineKeyboardButton[],
  ): Promise<void>;

  async ui(
    message: string,
    markup: KeyboardMarkupRef | InlineKeyboardMarkup | InlineKeyboardButton[],
    options: Partial<DialogOptions>,
  ): Promise<void>;

  async ui(
    message?: string,
    markup?: KeyboardMarkupRef | InlineKeyboardMarkup | InlineKeyboardButton[],
    options?: Partial<DialogOptions>,
  ): Promise<void> {
    const resolveMarkup = (): InlineKeyboardMarkup => {
      return 'inline_keyboard' in markup
        ? <InlineKeyboardMarkup>markup
        : 'reply_markup' in markup
        ? <InlineKeyboardMarkup>markup.reply_markup
        : Markup.inlineKeyboard(markup);
    };

    const webhookReply = this.context.telegram.webhookReply;
    const { dialog } = this.internalState();
    const redraw = arguments.length === 0;

    this.context.telegram.webhookReply = false;
    try {
      // Redraw current UI from scratch
      if (redraw) {
        if (!dialog) throw new Error('Nothing to redraw');
        await this.deleteUi(dialog.handle);
        await this.createUi(dialog.message, dialog.markup, {
          disable_notification: true,
        });
      } else {
        if (dialog) {
          const { recreate } = options || { recreate: false };
          if (!recreate) {
            // eslint-disable-next-line prettier/prettier
            await this.updateUi(dialog.handle, message, resolveMarkup(), options);
          } else {
            await this.deleteUi(dialog.handle);
            await this.createUi(message, resolveMarkup(), options);
          }
        } else {
          await this.createUi(message, resolveMarkup(), options);
        }
      }
    } finally {
      this.context.telegram.webhookReply = webhookReply;
    }
  }

  private async createUi(
    message: string,
    markup: InlineKeyboardMarkup,
    options: Partial<DialogOptions>,
  ): Promise<number> {
    const { message_id } = await this.context.reply(message, {
      disable_notification: true,
      disable_web_page_preview: true,
      reply_markup: markup,
      ...options,
    });

    this.internalState({
      dialog: {
        handle: message_id,
        markup: markup,
        message: message,
      },
    });

    return message_id;
  }

  private async updateUi(
    handle: number,
    message: string,
    markup: InlineKeyboardMarkup,
    options: Partial<DialogOptions>,
  ): Promise<number> {
    const extra: ExtraEditMessage = {
      disable_notification: true,
      disable_web_page_preview: true,
      reply_markup: markup,
      ...options,
    };

    await this.context.telegram.editMessageText(
      this.context.chat.id,
      handle,
      undefined,
      message,
      extra,
    );

    this.internalState({
      dialog: {
        handle: handle,
        markup: markup,
        message: message,
      },
    });

    return handle;
  }

  private async deleteUi(handle: number): Promise<void> {
    await this.context.deleteMessage(handle);
    this.internalState({
      dialog: null,
    });
  }

  state<T extends TObject>(update?: Partial<T>, scene?: string): T {
    const { scenes } = this.internalState();
    const [, activeScene] = scenes;
    const key = `__wizard_chat_state_${this.context.chat.id}__${
      scene || activeScene
    }`;

    const state = this.context.session[key] || {};

    if (update) {
      this.context.session[key] = {
        ...state,
        ...update,
      };
    }

    return state;
  }

  private async completeQuery(): Promise<void> {
    try {
      await this.context.answerCbQuery();
    } catch {}
  }

  private internalState(
    update?: Partial<DialogWizardState>,
  ): DialogWizardState {
    const key = '__wizard_internal_state';
    const state: DialogWizardState = this.context.session[key] || {
      scenes: [],
    };
    if (update) {
      this.context.session[key] = {
        ...state,
        ...update,
      };
    }

    return state;
  }
}

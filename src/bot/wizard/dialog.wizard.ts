import { text } from 'express';
import { reverse } from 'src/utils/helpers';
import { Drop, TObject } from 'src/utils/utility.types';
import { Markup } from 'telegraf';
import { MiddlewareFn } from 'telegraf/typings/composer';
import { InlineKeyboardButton } from 'telegraf/typings/markup';
import {
  ExtraReplyMessage,
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from 'telegraf/typings/telegram-types';
import { BotContext } from '../bot.context';

type DialogWizardState = {
  dialog?: number;
  scenes?: Array<string>;
};

type NavigateOptions<T extends TObject> = {
  fromDialog: boolean;
  silent: boolean;
  state?: T;
};

type ReturnOptions<T extends TObject> = {
  fallback: string;
  silent: boolean;
  state?: T;
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
  mode: 'update' | 'recreate';
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

  async return<TState extends TObject>(
    options?: Partial<ReturnOptions<TState>>,
  ): Promise<void> {
    const { scenes } = this.internalState();
    const [activeScene, previousScene] = reverse(scenes);
    const { silent, state, fallback } = options || { silent: false };
    const { scene } = this.context;

    if (!activeScene) {
      if (!previousScene || !fallback) throw new Error(`No dialog to return`);
    }

    await scene.leave();

    scenes.pop();
    this.internalState({
      scenes: scenes,
    });

    await scene.enter(previousScene || fallback, state, silent);
  }

  async navigate<TState extends TObject>(
    scene: string,
    options?: Partial<NavigateOptions<TState>>,
  ): Promise<void> {
    const { fromDialog, silent, state } = options || {
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

    await this.context.scene.enter(scene, state, silent);
  }

  async ui(
    message: string,
    markup: KeyboardMarkupRef | InlineKeyboardMarkup | InlineKeyboardButton[],
    options?: Partial<DialogOptions>,
  ): Promise<number> {
    const resolveMarkup = (): InlineKeyboardMarkup => {
      return 'inline_keyboard' in markup
        ? <InlineKeyboardMarkup>markup
        : 'reply_markup' in markup
        ? <InlineKeyboardMarkup>markup.reply_markup
        : Markup.inlineKeyboard(markup);
    };

    const createUi = async (): Promise<number> => {
      const { message_id } = await this.context.reply(message, {
        disable_notification: true,
        disable_web_page_preview: true,
        reply_markup: resolveMarkup(),
        ...options,
      });

      if (message_id) {
        this.internalState({
          dialog: message_id,
        });
      }

      return message_id;
    };

    const updateUi = async (dialog: number): Promise<void> => {
      await this.context.telegram.editMessageText(
        this.context.chat.id,
        dialog,
        undefined,
        message,
        {
          disable_notification: true,
          disable_web_page_preview: true,
          reply_markup: resolveMarkup(),
          ...options,
        },
      );
    };

    const deleteUi = async (dialog: number): Promise<boolean> => {
      try {
        return await this.context.deleteMessage(dialog);
      } catch {
        return false;
      }
    };

    const webhookReply = this.context.telegram.webhookReply;
    const { dialog } = this.internalState();
    const { mode } = options || { mode: 'update' };

    this.context.telegram.webhookReply = false;
    try {
      if (dialog) {
        // Refesh currenly active UI
        if (mode === 'update') {
          try {
            await updateUi(dialog);
          } catch {
            await deleteUi(dialog);
            return await createUi();
          }
          // Delete prev UI and draw a new one
        } else {
          await deleteUi(dialog);
          return createUi();
        }
      } else {
        return await createUi();
      }
    } finally {
      this.context.telegram.webhookReply = webhookReply;
    }
  }

  state<T extends TObject>(update?: Partial<TObject>): T {
    const key = `__wizard_chat_state_${this.context.chat.id}`;
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

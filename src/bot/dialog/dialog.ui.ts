import { Markup } from 'telegraf';
import { MiddlewareFn } from 'telegraf/typings/composer';
import { InlineKeyboardButton } from 'telegraf/typings/markup';
import {
  InlineKeyboardMarkup,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
  ExtraReplyMessage,
  ExtraEditMessage,
} from 'telegraf/typings/telegram-types';
import { BotContext } from '../bot.context';

type DialogMarkup =
  | KeyboardMarkupRef
  | InlineKeyboardMarkup
  | InlineKeyboardButton[];

type DialogState = {
  handle?: number;
  hidden: boolean;
  message?: string;
  markup?: InlineKeyboardMarkup;
  options?: DialogOptions;
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
  reset: boolean;
};

export class DialogUi {
  constructor(private readonly bot: BotContext) {}

  async popup(message: string): Promise<void> {
    try {
      await this.bot.answerCbQuery(message, true);
    } catch {}
  }

  async delete(): Promise<void> {
    const state = this.state();
    if (state.handle) {
      await this.$delete(state.handle);
    }
  }

  async notification(message: string, extra?: ExtraReplyMessage, ttl?: number) {
    const ms = ttl || 5000;
    const wh = this.bot.telegram.webhookReply;

    try {
      this.bot.telegram.webhookReply = false;

      const { message_id } = await this.bot.reply(message, extra);
      setTimeout(async () => {
        try {
          await this.bot.deleteMessage(message_id);
        } catch (err) {
          // ignore
        }
      }, ms);
    } finally {
      this.bot.telegram.webhookReply = wh;
    }
  }

  async render(
    message: string,
    markup?: DialogMarkup,
    options?: Partial<DialogOptions>,
  ): Promise<void> {
    const currentState = this.state();
    const keyboardMarkup = this.resolve(markup);

    // eslint-disable-next-line prettier/prettier
    if (currentState.message === message && currentState.markup === keyboardMarkup) {
      return;
    }

    const opts: DialogOptions = {
      reset: false,
      disable_notification: true,
      disable_web_page_preview: true,
      ...options,
    };

    const { handle } = currentState;
    if (!handle) {
      await this.$create(message, keyboardMarkup, opts);
      // create ui
    } else {
      if (opts.reset) {
        // reset
        await this.$delete(handle);
        await this.$create(message, keyboardMarkup, opts);
      } else {
        // refresh
        await this.$update(handle, message, keyboardMarkup, opts);
      }
    }
  }

  async visible(makeVisible?: boolean): Promise<void> {
    makeVisible = makeVisible === undefined ? true : makeVisible;

    const state = this.state();
    if (makeVisible) {
      if (state.hidden) {
        process.nextTick(async () => {
          await this.$create(state.message, state.markup, state.options);
        });

        this.state({
          hidden: false,
        });
      }
    } else {
      if (!state.hidden && state.handle) {
        await this.$delete(state.handle);

        this.state({
          hidden: true,
          markup: state.markup,
          message: state.message,
          options: state.options,
        });
      }
    }
  }

  private async $delete(handle: number): Promise<void> {
    await this.bot.telegram.deleteMessage(this.bot.chat.id, handle);

    this.state({
      handle: undefined,
      markup: undefined,
      message: undefined,
      options: undefined,
      hidden: false,
    });
  }

  // eslint-disable-next-line prettier/prettier
  private async $create(message: string, markup: InlineKeyboardMarkup, options?: DialogOptions): Promise<number> {
    const webhook = this.bot.telegram.webhookReply;
    this.bot.telegram.webhookReply = false;

    try {
      const { message_id } = await this.bot.tg.sendMessage(
        this.bot.chat.id,
        message,
        {
          disable_notification: true,
          disable_web_page_preview: true,
          reply_markup: markup,
          ...options,
        },
      );

      this.state({
        handle: message_id,
        markup: markup,
        message: message,
        options: options,
      });

      return message_id;
    } finally {
      this.bot.telegram.webhookReply = webhook;
    }
  }

  // eslint-disable-next-line prettier/prettier
  private async $update(handle: number, message: string, markup: InlineKeyboardMarkup, options?: DialogOptions): Promise<number> {
    const extra: ExtraEditMessage = {
      disable_notification: true,
      disable_web_page_preview: true,
      reply_markup: markup,
      ...options,
    };

    await this.bot.telegram.editMessageText(
      this.bot.chat.id,
      handle,
      undefined,
      message,
      extra,
    );

    this.state({
      markup: markup,
      message: message,
      options: options,
    });

    return handle;
  }

  private resolve(markup?: DialogMarkup): InlineKeyboardMarkup {
    if (!markup) return Markup.inlineKeyboard([]);

    return 'inline_keyboard' in markup
      ? <InlineKeyboardMarkup>markup
      : 'reply_markup' in markup
      ? <InlineKeyboardMarkup>markup.reply_markup
      : Markup.inlineKeyboard(markup);
  }

  private state(update?: Partial<DialogState>) {
    const key = '__dialog_ui_state__';
    const state: DialogState = this.bot.session[key] || {
      empty: true,
    };

    if (update) {
      this.bot.session[key] = <DialogState>{
        ...state,
        ...update,
        empty: false,
      };
    }

    return state;
  }
}

export function ui(): MiddlewareFn<BotContext> {
  return async function (ctx, next) {
    if (!ctx.ui) {
      ctx.ui = new DialogUi(ctx);
    }
    return await next();
  };
}

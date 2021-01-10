import { User } from 'telegraf/typings/telegram-types';

type Drop<TSource, TKeys extends keyof TSource> = Omit<TSource, TKeys>;
type Optional<T extends Record<string, any>, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

type FailureType = 'unknown' | 'unauthorized';
type FailureBase = {
  message: string;
  reply?: {
    message: string;
  };
};

type Failure<
  TType extends keyof Pick<Record<FailureType, never>, FailureType>,
  TDetails extends Record<string, any> = Record<string, never>
> = {
  type: TType;
  // eslint-disable-next-line prettier/prettier
} & TDetails & FailureBase;

export type Unknown = Failure<'unknown'>;
export type Unauthorized = Failure<
  'unauthorized',
  {
    from: User;
  }
>;

export type BotFailure = Unknown | Unauthorized;

export class BotException<TFailure extends BotFailure = Unknown> extends Error {
  constructor(public failure: TFailure) {
    super(failure.message);
  }

  public static unauthorized(
    failure: Optional<Drop<Unauthorized, 'type'>, 'message'>,
  ): BotException<Unauthorized> {
    const message =
      failure.message ||
      `unauthorized request from user ${failure.from.username}`;

    return new BotException<Unauthorized>({
      type: 'unauthorized',
      ...failure,
      ...{ message },
    });
  }
}

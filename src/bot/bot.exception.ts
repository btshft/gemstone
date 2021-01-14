import { Drop, Optional } from 'src/utils/utility.types';
import { User } from 'telegraf/typings/telegram-types';

type FailureType = 'unknown' | 'unauthorized';
type FailureBase = {
  message: string;
  reply?: {
    message: string;
    scene?: boolean;
  };
};

type Failure<
  TType extends keyof Pick<Record<FailureType, never>, FailureType>,
  TDetails extends Record<string, any> = Record<string, never>
> = {
  type: TType;
  // eslint-disable-next-line prettier/prettier
} & TDetails & FailureBase;

export type UnknownFailure = Failure<'unknown'>;
export type Unauthorized = Failure<
  'unauthorized',
  {
    from: User;
  }
>;

export type BotFailure = UnknownFailure | Unauthorized;

export class BotException<
  TFailure extends BotFailure = UnknownFailure
> extends Error {
  constructor(public failure: TFailure) {
    super(failure.message);
  }

  public static unauthorized(
    failure: Optional<Drop<Unauthorized, 'type'>, 'message'>,
  ): BotException<Unauthorized> {
    // eslint-disable-next-line prettier/prettier
    const message = failure.message || `unauthorized request from user ${failure.from.username}`;

    return new BotException<Unauthorized>({
      type: 'unauthorized',
      ...failure,
      ...{ message },
    });
  }
}

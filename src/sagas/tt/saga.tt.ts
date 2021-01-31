import { Saga } from '@prisma/client';
import { Drop } from 'src/utils/utility.types';

type _States = {
  ['saga:tt:request']: TtSagaMetadata;
};

type _Type<TKey extends keyof _States> = TKey;
type _BuildTtSaga<TState extends TtSagaStates> = Drop<
  Saga,
  'metadata' | 'type' | 'state'
> & {
  state: TState;
  type: _Type<'saga:tt:request'>;
  metadata: _States['saga:tt:request'][TState];
};

export type TtSagaMetadata = {
  ['tt:s3:upload']: {
    url: string;
    tgChatId: string | number;
    ttUser: string;
    ttId: string;
    userId: string;
    messageId: number;
  };
  ['tt:tg:send']: _States['saga:tt:request']['tt:s3:upload'] & {
    upload: {
      bucket: string;
      key: string;
      presignedUrl: string;
    };
  };
};

export type TtSagaStates = keyof _States['saga:tt:request'];
export type TtSagaType = keyof _States;

export type TtSagaS3Upload = _BuildTtSaga<'tt:s3:upload'>;
export type TtSagaTgSend = _BuildTtSaga<'tt:tg:send'>;
export type TtSaga = TtSagaS3Upload | TtSagaTgSend;

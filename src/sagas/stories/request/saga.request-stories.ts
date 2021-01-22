import { Saga } from '@prisma/client';
import { ReelsMediaFeedResponseItem } from 'instagram-private-api';
import { Drop } from 'src/utils/utility.types';

type _States = {
  ['saga:stories:request']: RequestStoriesSagaMetadata;
};

type _Type<TKey extends keyof _States> = TKey;
type _BuildStoriesSaga<TState extends RequestStoriesSagaStates> = Drop<
  Saga,
  'metadata' | 'type' | 'state'
> & {
  state: TState;
  type: _Type<'saga:stories:request'>;
  metadata: _States['saga:stories:request'][TState];
};

export type RequestStoriesSagaMetadata = {
  ['ig:get-json']: {
    igUserId: string | number;
    igUsername: string;
    tgChatId: string | number;
    userId: string;
  };
  ['s3:upload']: _States['saga:stories:request']['ig:get-json'] & {
    stories: ReelsMediaFeedResponseItem[];
  };
  ['tg:send']: _States['saga:stories:request']['ig:get-json'] & {
    bucket: string;
    uploads: S3UploadedReel[];
  };
};

export type RequestStoriesSagaStates = keyof _States['saga:stories:request'];
export type RequestStoriesSagaType = keyof _States;

// eslint-disable-next-line prettier/prettier
export type RequestStoriesSagaGetJson = _BuildStoriesSaga<'ig:get-json'>;

// eslint-disable-next-line prettier/prettier
export type RequestStoriesSagaS3Upload = _BuildStoriesSaga<'s3:upload'>;

// eslint-disable-next-line prettier/prettier
export type RequestStoriesSagaTgSend = _BuildStoriesSaga<'tg:send'>;

export type RequestStoriesSaga =
  | RequestStoriesSagaGetJson
  | RequestStoriesSagaS3Upload
  | RequestStoriesSagaTgSend;

export type S3UploadedReel = ReelsMediaFeedResponseItem & {
  s3: {
    key: string;
    url: string;
    presignedUrl: string;
  };
};

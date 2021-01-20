import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Saga } from '@prisma/client';
import {
  SagaHandler,
  SagaTypes,
  StoriesSaga,
  StoriesSagaState,
} from '../saga.types';
import { IgGetJsonHandler } from '../stories/request/ig-get-json.handler';
import { S3UploadHandler } from '../stories/request/s3-upload.handler';
import { TgSendHandler } from '../stories/request/tg-send.handler';

@Injectable()
export class SagaHandlerResolver {
  constructor(private moduleRef: ModuleRef) {}

  resolve(saga: Readonly<Saga>): SagaHandler<any> {
    const type = <SagaTypes>saga.type;
    switch (type) {
      case 'saga:stories:request':
        return this.resolveStoriesHandler(saga);
      default:
        throw new Error(`Unknown saga type '${type}'`);
    }
  }

  // eslint-disable-next-line prettier/prettier
  private resolveStoriesHandler(saga: Readonly<Saga>): SagaHandler<StoriesSaga> {
    const state = <StoriesSagaState>saga.state;
    switch (state) {
      case 'ig:get-json':
        return this.moduleRef.get(IgGetJsonHandler);
      case 's3:upload':
        return this.moduleRef.get(S3UploadHandler);
      case 'tg:send':
        return this.moduleRef.get(TgSendHandler);
      default:
        throw new Error(`Unknown saga state '${state}'`);
    }
  }
}

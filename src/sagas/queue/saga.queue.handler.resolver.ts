import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Saga } from '@prisma/client';
import { GenerateFollowersInsightHandler } from '../insight/followers/handlers/generate-followers-insight.handler';
import { IgGetFollowersHandler } from '../insight/followers/handlers/ig-get-followers.handler';
import { SendFollowersInsightHandler } from '../insight/followers/handlers/send-followers-insight.handler';
import { FollowersInsightSagaStates } from '../insight/followers/saga.insight-followers';
import { SagaHandler, SagaTypes } from '../saga.types';
import { IgGetJsonHandler } from '../stories/request/handlers/ig-get-json.handler';
import { S3UploadHandler } from '../stories/request/handlers/s3-upload.handler';
import { TgSendHandler } from '../stories/request/handlers/tg-send.handler';
import {
  RequestStoriesSaga,
  RequestStoriesSagaStates,
} from '../stories/request/saga.request-stories';
import { TtS3UploadHandler } from '../tt/handlers/tt.s3-upload.handler';
import { TtTgSendHandler } from '../tt/handlers/tt.tg-send.handler';
import { TtSagaStates } from '../tt/saga.tt';

@Injectable()
export class SagaHandlerResolver {
  constructor(private moduleRef: ModuleRef) {}

  resolve(saga: Readonly<Saga>): SagaHandler<any> {
    const type = <SagaTypes>saga.type;
    switch (type) {
      case 'saga:stories:request':
        return this.resolveStoriesHandler(saga);
      case 'saga:insight:followers':
        return this.resolveFollowersInsightHandler(saga);
      case 'saga:tt:request':
        return this.resolveTtHandler(saga);
      default:
        throw new Error(`Unknown saga type '${type}'`);
    }
  }

  // eslint-disable-next-line prettier/prettier
  private resolveStoriesHandler(saga: Readonly<Saga>): SagaHandler<RequestStoriesSaga> {
    const state = <RequestStoriesSagaStates>saga.state;
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

  private resolveFollowersInsightHandler(
    saga: Readonly<Saga>,
  ): SagaHandler<RequestStoriesSaga> {
    const state = <FollowersInsightSagaStates>saga.state;
    switch (state) {
      case 'ig:followers:get':
        return this.moduleRef.get(IgGetFollowersHandler);
      case 'insight:followers:generate':
        return this.moduleRef.get(GenerateFollowersInsightHandler);
      case 'insight:followers:send':
        return this.moduleRef.get(SendFollowersInsightHandler);
      default:
        throw new Error(`Unknown saga state '${state}'`);
    }
  }

  private resolveTtHandler(saga: Readonly<Saga>) {
    const state = <TtSagaStates>saga.state;
    switch (state) {
      case 'tt:s3:upload':
        return this.moduleRef.get(TtS3UploadHandler);
      case 'tt:tg:send':
        return this.moduleRef.get(TtTgSendHandler);
      default:
        throw new Error(`Unknown saga state '${state}'`);
    }
  }
}

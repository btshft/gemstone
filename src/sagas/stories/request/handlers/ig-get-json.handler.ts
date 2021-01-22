import { Injectable, Logger } from '@nestjs/common';
import { ReelsMediaFeedResponseItem } from 'instagram-private-api';
import { IgService } from 'src/ig/ig.service';
import { SagaHandler } from 'src/sagas/saga.types';
import { iterator } from 'src/utils/observable.async-iterator';
import { SagaService } from '../../../saga.service';
import {
  RequestStoriesSaga,
  RequestStoriesSagaGetJson,
} from '../saga.request-stories';

@Injectable()
// eslint-disable-next-line prettier/prettier
export class IgGetJsonHandler implements SagaHandler<RequestStoriesSagaGetJson> {
  private readonly logger = new Logger(IgGetJsonHandler.name);

  constructor(private sagaService: SagaService, private ig: IgService) {}

  async handle(saga: RequestStoriesSagaGetJson): Promise<void> {
    const { metadata } = saga;
    const stories$ = this.ig.stories$(metadata.igUserId);

    let stories: ReelsMediaFeedResponseItem[] = [];
    for await (const iteration of iterator(stories$)) {
      stories = [...stories, ...iteration];
    }

    this.logger.log({
      message: 'Stories loaded from IG',
      username: metadata.igUsername,
      count: stories.length,
    });

    await this.sagaService.move<RequestStoriesSaga>(saga.id, 's3:upload', {
      ...metadata,
      stories: stories,
    });
  }
}

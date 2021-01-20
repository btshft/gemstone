import { Injectable, Logger } from '@nestjs/common';
import { ReelsMediaFeedResponseItem } from 'instagram-private-api';
import { IgService } from 'src/ig/ig.service';
import { iterator } from 'src/utils/observable.async-iterator';
import { SagaService } from '../../saga.service';
import { SagaHandler, StoriesSaga, StoriesSagaGetJson } from '../../saga.types';

@Injectable()
export class IgGetJsonHandler implements SagaHandler<StoriesSagaGetJson> {
  private readonly logger = new Logger(IgGetJsonHandler.name);

  constructor(private sagaService: SagaService, private ig: IgService) {}

  async handle(saga: StoriesSagaGetJson): Promise<void> {
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

    await this.sagaService.move<StoriesSaga>(saga.id, 's3:upload', {
      ...metadata,
      stories: stories,
    });
  }
}

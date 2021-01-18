import { Injectable, Logger } from '@nestjs/common';
import { SagaService } from '../saga.service';
import { SagaHandler, StoriesSaga, StoriesSagaGetJson } from '../saga.types';

@Injectable()
export class IgGetJsonHandler implements SagaHandler<StoriesSagaGetJson> {
  private readonly logger = new Logger(IgGetJsonHandler.name);

  constructor(private sagaService: SagaService<StoriesSaga>) {}

  async handle(saga: StoriesSagaGetJson): Promise<void> {
    const { metadata } = saga;

    this.logger.log({
      message: 'ig get json',
      metadata,
    });

    await this.sagaService.move(saga.id, 's3:upload', {
      ...metadata,
      stories: [],
    });
  }
}

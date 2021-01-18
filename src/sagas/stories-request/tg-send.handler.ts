import { Injectable, Logger } from '@nestjs/common';
import { SagaService } from '../saga.service';
import { SagaHandler, StoriesSaga, StoriesSagaTgSend } from '../saga.types';

@Injectable()
export class TgSendHandler implements SagaHandler<StoriesSagaTgSend> {
  private readonly logger = new Logger(TgSendHandler.name);

  constructor(private sagaService: SagaService<StoriesSaga>) {}

  async handle(saga: StoriesSagaTgSend): Promise<void> {
    const { metadata } = saga;

    this.logger.log({
      message: 'tg send',
      metadata,
    });

    await this.sagaService.complete(saga.id);
  }
}

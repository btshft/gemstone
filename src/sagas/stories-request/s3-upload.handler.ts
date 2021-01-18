import { Injectable, Logger } from '@nestjs/common';
import { SagaService } from '../saga.service';
import { SagaHandler, StoriesSaga, StoriesSagaS3Upload } from '../saga.types';

@Injectable()
export class S3UploadHandler implements SagaHandler<StoriesSagaS3Upload> {
  private readonly logger = new Logger(S3UploadHandler.name);

  constructor(private sagaService: SagaService<StoriesSaga>) {}

  async handle(saga: StoriesSagaS3Upload): Promise<void> {
    const { metadata } = saga;

    this.logger.log({
      message: 's3 upload',
      metadata,
    });

    await this.sagaService.move(saga.id, 'tg:send', {
      ...metadata,
      bucket: '',
      keys: [],
    });
  }
}

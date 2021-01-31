import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'src/s3/s3';
import { SagaService } from 'src/sagas/saga.service';
import { SagaHandler } from 'src/sagas/saga.types';
import { TtService } from 'src/tt/tt.service';
import { TtSaga, TtSagaS3Upload } from '../saga.tt';

@Injectable()
export class TtS3UploadHandler implements SagaHandler<TtSagaS3Upload> {
  private readonly logger = new Logger(TtS3UploadHandler.name);

  constructor(
    private readonly ttService: TtService,
    private readonly s3: S3,
    private sagaService: SagaService,
  ) {}

  async handle(saga: TtSagaS3Upload): Promise<void> {
    const { metadata } = saga;

    const buffer = await this.ttService.video(metadata.url);
    if (buffer.length < 1) throw new Error('Buffer is empty');

    const bucketName = `u${metadata.userId}-${metadata.ttUser}`;
    const key = `${metadata.ttUser}-${metadata.ttId}.mp4`;
    const bucket = await this.s3.bucket(bucketName);

    await bucket.put(key, buffer, {
      tt_id: metadata.ttId,
      tt_uid: metadata.ttUser,
      tt_url: metadata.url,
    });

    const presignedUrl = await bucket.presignedUrl(key);
    this.logger.log({
      message: 'TT uploaded',
      ...metadata,
    });

    await this.sagaService.move<TtSaga>(saga.id, 'tt:tg:send', {
      ...metadata,
      upload: {
        bucket: bucketName,
        key: key,
        presignedUrl: presignedUrl,
      },
    });
  }
}

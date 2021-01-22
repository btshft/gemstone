import { Injectable, Logger } from '@nestjs/common';
import cuid from 'cuid';
import { ReelsMediaFeedResponseItem } from 'instagram-private-api';
import { Prisma } from 'src/database/services/prisma';
import { S3 } from 'src/s3/s3';
import { SagaHandler } from 'src/sagas/saga.types';
import { compact } from 'src/utils/helpers';
import { SagaService } from '../../../saga.service';
import {
  RequestStoriesSaga,
  RequestStoriesSagaS3Upload,
  S3UploadedReel,
} from '../saga.request-stories';
import { StoryFileMetadata } from '../story.file.metadata';

@Injectable()
// eslint-disable-next-line prettier/prettier
export class S3UploadHandler implements SagaHandler<RequestStoriesSagaS3Upload> {
  private readonly logger = new Logger(S3UploadHandler.name);

  constructor(
    private sagaService: SagaService,
    private s3: S3,
    private prisma: Prisma,
  ) {}

  async handle(saga: RequestStoriesSagaS3Upload): Promise<void> {
    const { metadata } = saga;
    const bucketName = `u${metadata.userId}-ig${metadata.igUserId}`;
    const bucket = await this.s3.bucket(bucketName);

    const viewedStories = await this.prisma.viewHistory.findMany({
      where: {
        userId: metadata.userId,
        igUserId: String(metadata.igUserId),
      },
      select: {
        storyKey: true,
      },
    });

    const unseenStories = metadata.stories.filter(
      (s) => !viewedStories.some((vs) => vs.storyKey === String(s.id)),
    );

    let uploaded: S3UploadedReel[] = [];
    for (const story of unseenStories) {
      try {
        const url = this.resolveUrl(story);
        if (!url) {
          throw new Error('Unable to resolve download URL');
        }

        const type = this.isVideo(story) ? 'video' : 'img';
        const extension = type === 'video' ? 'mp4' : 'jpg';
        const key = `${story.id}__${cuid()}.${extension}`;
        const meta: StoryFileMetadata = {
          expiring_at: story.expiring_at,
          taken_at: story.taken_at,
          type: story.media_type,
          url: url,
          caption: story.caption,
          codec: story.video_codec,
          duration: story.video_duration,
        };

        await bucket.upload<StoryFileMetadata>(url, key, compact(meta));
        const presignedUrl = await bucket.presignedUrl(key);

        uploaded = [
          ...uploaded,
          {
            ...story,
            s3: {
              key: key,
              url: url,
              presignedUrl: presignedUrl,
            },
          },
        ];
      } catch (err) {
        this.logger.error({
          message: 'Unable to upload story to S3',
          story_id: story.id,
          saga_id: saga.id,
          reason: err.message || JSON.stringify(err),
        });
      }
    }

    this.logger.log({
      message: 'Stories uploaded to S3',
      original_count: metadata.stories.length,
      unseen_count: unseenStories.length,
      uploaded_count: uploaded.length,
    });

    await this.sagaService.move<RequestStoriesSaga>(saga.id, 'tg:send', {
      ...metadata,
      bucket: bucketName,
      uploads: uploaded,
    });
  }

  private isVideo(reel: ReelsMediaFeedResponseItem): boolean {
    return reel.video_versions?.length > 0;
  }

  private resolveUrl(reel: ReelsMediaFeedResponseItem): string {
    if (reel.video_versions && reel.video_versions.length) {
      const [version] = reel.video_versions;
      return version.url;
    }

    const [image] = reel.image_versions2.candidates || [];
    return image?.url;
  }
}

import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { TObject } from 'src/utils/utility.types';
import { Readable } from 'stream';
import { S3Configuration } from './s3.configuration';

type S3Stream = Buffer | Readable | string;

export type Meta<TMeta extends TObject> = {
  size: number;
  etag: string;
  lastModified: Date;
  metadata: TMeta;
};

@Injectable()
export class S3 {
  private readonly minio: Client;
  private bucketRefs: string[] = [];

  constructor(options: S3Configuration) {
    this.minio = new Client({
      accessKey: options.accessKey,
      endPoint: options.endpoint,
      secretKey: options.secretKey,
      useSSL: true,
    });
  }

  async bucket(bucket: string): Promise<S3Bucket> {
    // eslint-disable-next-line prettier/prettier
    const exists =
      this.bucketRefs.includes(bucket) ||
      (await this.minio.bucketExists(bucket));
    if (!exists) {
      await this.minio.makeBucket(bucket, 'us-east-1');
      this.bucketRefs = [bucket, ...this.bucketRefs];
    }

    return new S3Bucket(this.minio, bucket);
  }
}

class S3Bucket {
  constructor(private minio: Client, private bucket: string) {}

  async put<TMeta extends TObject>(
    key: string,
    data: S3Stream,
    metadata?: TMeta,
  ): Promise<string> {
    return await this.minio.putObject(this.bucket, key, data, metadata);
  }

  async get(key: string): Promise<Readable> {
    return await this.minio.getObject(this.bucket, key);
  }

  async metadata<TMeta extends TObject>(key: string): Promise<Meta<TMeta>> {
    const meta = await this.minio.statObject(this.bucket, key);
    return {
      etag: meta.etag,
      lastModified: meta.lastModified,
      metadata: <TMeta>meta.metaData,
      size: meta.size,
    };
  }
}

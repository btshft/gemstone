import { HttpService, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Client } from 'minio';
import { TObject } from 'src/utils/utility.types';
import { Readable } from 'stream';
import s3Configuration from './s3.configuration';

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

  constructor(
    @Inject(s3Configuration.KEY)
    private config: ConfigType<typeof s3Configuration>,
    private http: HttpService,
  ) {
    this.minio = new Client({
      accessKey: this.config.accessKey,
      endPoint: this.config.endpoint,
      secretKey: this.config.secretKey,
      port: this.config.port,
      useSSL: this.config.ssl,
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

    return new S3Bucket(this.minio, this.http, bucket);
  }
}

class S3Bucket {
  constructor(
    private minio: Client,
    private http: HttpService,
    private bucket: string,
  ) {}

  async put<TMeta extends TObject>(
    key: string,
    data: S3Stream,
    metadata?: TMeta,
  ): Promise<string> {
    return await this.minio.putObject(this.bucket, key, data, metadata);
  }

  async upload<TMeta extends TObject>(
    url: string,
    key: string,
    metadata?: TMeta,
  ): Promise<void> {
    const response = await this.http.axiosRef.request({
      url: url,
      method: 'GET',
      responseType: 'stream',
    });

    await this.put(key, response.data, metadata);
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

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import s3Configuration from './s3.configuration';
import { S3 } from './s3.store';

@Module({
  exports: [S3],
  imports: [ConfigModule.forFeature(s3Configuration)],
  providers: [
    {
      inject: [s3Configuration.KEY],
      provide: S3,
      useFactory: (config: ConfigType<typeof s3Configuration>): S3 => {
        return new S3(config);
      },
    },
  ],
})
export class S3Module {}

import { HttpModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3 } from './s3';
import s3Configuration from './s3.configuration';

@Module({
  exports: [S3],
  imports: [ConfigModule.forFeature(s3Configuration), HttpModule.register({})],
  providers: [S3],
})
export class S3Module {}

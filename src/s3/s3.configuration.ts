import { registerAs } from '@nestjs/config';

export type S3Configuration = {
  accessKey: string;
  secretKey: string;
  endpoint: string;
  port: number;
  ssl: boolean;
};

export default registerAs(
  's3',
  (): S3Configuration => ({
    accessKey: process.env.S3_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
    secretKey: process.env.S3_SECRET_KEY,
    port: parseInt(process.env.S3_PORT) || 9000,
    ssl: !!process.env.S3_USE_SSL,
  }),
);

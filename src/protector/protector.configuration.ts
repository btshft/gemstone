import { registerAs } from '@nestjs/config';

export default registerAs('protector', () => ({
  key: process.env.PROTECTOR_KEY,
}));

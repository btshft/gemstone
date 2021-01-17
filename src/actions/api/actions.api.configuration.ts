import { registerAs } from '@nestjs/config';

export default registerAs('actions/api', () => ({
  apiBaseUrl: process.env.API_BASE_URL,
  apiKey: process.env.API_SECRET_KEY,
}));

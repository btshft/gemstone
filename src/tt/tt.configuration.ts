import { registerAs } from '@nestjs/config';

const parseList = (value?: string): string[] => {
  if (value) {
    return value
      .split(';')
      .map((v) => v?.trim())
      .filter((v) => !!v)
      .map((v) => `sid_tt=${v}`);
  }

  return [];
};

export default registerAs('tt', () => ({
  sessions: parseList(process.env.TT_SESSIONS),
}));

import { IgUser } from '@prisma/client';

type ExtendedIgUser = IgUser & {
  seen: boolean;
};

export type FollowersInsightModel = {
  generatedAt: string;
  expireAt: string;
  surface: {
    username: string;
    drift: boolean;
  };
  notFollowedBy: ExtendedIgUser[];
  notFollowingBack: ExtendedIgUser[];
};

export type FollowersInsightPayload = {
  surface: {
    username: string;
    drift: boolean;
  };
  notFollowedBy: string[];
  notFollowingBack: string[];
  newFollowers: string[];
  newFollowings: string[];
  newUnfollowers: string[];
  newUnfollowings: string[];
};

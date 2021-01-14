export type IgAuthStatus =
  | 'unknown'
  | 'authenticated'
  | 'failed'
  | 'challenge_required';
export type IgChallengeStatus =
  | 'unknown'
  | 'completed'
  | 'invalid'
  | 'required';

export type IgState = {
  auth?: {
    status: IgAuthStatus;
    updated: Date;
  };
  challenge?: {
    status: IgChallengeStatus;
    updated: Date;
  };
};

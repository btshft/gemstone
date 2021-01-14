export type IgApiClientOptions = {
  seed: string;
  username: string;
  password: string;
  proxy?: {
    hostname: string;
    username: string;
    password: string;
  };
};

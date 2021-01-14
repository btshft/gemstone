import { IgApiClient } from 'instagram-private-api';
import { TObject } from 'src/utils/utility.types';

class IgCheckpointService {
  private hooks: IgCheckpointHook<any>[] = [];

  constructor(private api: IgAugumentedApiClient) {}

  async commit(): Promise<TObject> {
    const result: Record<string, unknown> = {};
    for (const hook of this.hooks) {
      result[hook.name] = await hook.export(this.api);
    }

    return result;
  }

  async load(checkpoint: TObject): Promise<void> {
    for (const [key, value] of Object.entries(checkpoint)) {
      const hook = this.hooks.find((x) => x.name === key);
      if (hook) {
        await hook.import(value, this.api);
      }
    }
  }

  hook(hook: IgCheckpointHook<any>): void {
    if (this.hooks.some((x) => x.name === hook.name))
      throw new Error('Hook is already registered');

    this.hooks.push(hook);
  }
}

interface IgCheckpointHook<T> {
  name: string;
  export: (client: IgAugumentedApiClient) => Promise<T> | T;
  import: (data: T, client: IgAugumentedApiClient) => PromiseLike<void> | void;
}

export type IgApiClientOptions = {
  seed: string;
  username: string;
  password: string;
  proxyUrl?: string;
};

export class IgAugumentedApiClient extends IgApiClient {
  public checkpoint: IgCheckpointService;

  public get options(): Readonly<IgApiClientOptions> {
    return this.opts;
  }

  public constructor(private opts: IgApiClientOptions) {
    super();
    this.checkpoint = new IgCheckpointService(this);

    this.checkpoint.hook({
      name: 'client',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, prettier/prettier
      export: async (client) => await client.state.serialize().then(({ constants, ...state }) => state),
      import: (data, client) => client.state.deserialize(data),
    });
  }
}

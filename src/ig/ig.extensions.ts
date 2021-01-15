import { Logger } from '@nestjs/common';
import { IgApiClient } from 'instagram-private-api';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { Protector } from 'src/protector/protector';
import { Store } from 'src/store/store';
import { TObject } from 'src/utils/utility.types';
import { IgApiClientOptions } from './models/ig-api-client.options';
import {
  IgEncryptedInternalState,
  IgInternalState,
} from './models/ig-internal-state.model';

interface IgCheckpointHook<T> {
  name: string;
  export: (client: IgAugumentedApiClient) => Promise<T> | T;
  import: (data: T, client: IgAugumentedApiClient) => PromiseLike<void> | void;
}

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
      export: async (client) =>
        await client.state.serialize().then(({ constants, ...state }) => state),
      import: (data, client) => client.state.deserialize(data),
    });
  }
}

export async function createAugumented(
  options: IgApiClientOptions,
  store: Store,
  protector: Protector,
): Promise<IgAugumentedApiClient> {
  const stateKey = 'ig:internal:state';
  const logger = new Logger('ig:augumented');
  const ig = new IgAugumentedApiClient(options);

  ig.state.generateDevice(options.seed);

  if (options.proxy) {
    ig.request.defaults.agent = new SocksProxyAgent({
      host: options.proxy.hostname,
      userId: options.proxy.username,
      password: options.proxy.password,
    });
  }

  const encryptedState = await store.read<IgEncryptedInternalState>(stateKey);
  if (encryptedState) {
    const decryptedState = protector.unprotect<IgInternalState>(
      encryptedState.value,
    );

    await ig.checkpoint.load(decryptedState);
    logger.log({
      message: 'Checkpoint loaded',
      checkpoint: decryptedState,
    });
  }

  ig.request.end$.subscribe(async () => {
    try {
      const checkpoint = await ig.checkpoint.commit();
      await store.write<IgEncryptedInternalState>(stateKey, {
        value: protector.protect(checkpoint),
      });
    } catch (err) {
      logger.error({
        message: 'Checkpoint commit failed',
        error: err,
      });
    }
  });

  return ig;
}

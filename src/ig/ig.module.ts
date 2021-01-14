import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import SocksProxyAgent from 'socks-proxy-agent/dist/agent';
import { ProtectorModule } from 'src/protector/protector.module';
import { StoreModule } from 'src/store/store.module';
import igConfiguration from './ig.configuration';
import { IgAugumentedApiClient } from './ig.extensions';
import { IgService } from './ig.service';
import { StoriesLoadModule } from './stories/load/stories-load.module';

const igClientProvider: Provider = {
  provide: IgAugumentedApiClient,
  useFactory: (config: ConfigType<typeof igConfiguration>) => {
    const ig = new IgAugumentedApiClient({ ...config });
    ig.state.generateDevice(config.seed);

    if (config.proxy) {
      ig.request.defaults.agent = new SocksProxyAgent({
        host: config.proxy.hostname,
        userId: config.proxy.username,
        password: config.proxy.password,
      });
    }
    return ig;
  },
  inject: [igConfiguration.KEY],
};

@Module({
  imports: [
    ConfigModule.forFeature(igConfiguration),
    StoreModule,
    ProtectorModule,
    StoriesLoadModule,
  ],
  providers: [igClientProvider, IgService],
  exports: [IgService],
})
export class IgModule {}

import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { IgApiClient } from 'instagram-private-api';
import igConfiguration from './ig.configuration';
import { StoriesLoadModule } from './stories/load/stories-load.module';

export const IG_CLIENT = Symbol('IG_CLIENT');

const igClientProvider: Provider = {
  provide: IG_CLIENT,
  useFactory: (config: ConfigType<typeof igConfiguration>) => {
    const ig = new IgApiClient();

    ig.state.generateDevice(config.seed);
    if (config.proxyUrl) {
      ig.state.proxyUrl = config.proxyUrl;
    }

    return ig;
  },
  inject: [igConfiguration.KEY],
};

@Module({
  imports: [ConfigModule.forFeature(igConfiguration), StoriesLoadModule],
  providers: [igClientProvider],
})
export class IgModule {}

import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { Protector } from 'src/protector/protector';
import { ProtectorModule } from 'src/protector/protector.module';
import { Store } from 'src/store/store';
import { StoreModule } from 'src/store/store.module';
import igConfiguration from './ig.configuration';
import { createAugumented, IgAugumentedApiClient } from './ig.extensions';
import { IgService } from './ig.service';

const igClientProvider: Provider = {
  provide: IgAugumentedApiClient,
  useFactory: async (
    config: ConfigType<typeof igConfiguration>,
    store: Store,
    protector: Protector,
  ) => {
    return await createAugumented({ ...config }, store, protector);
  },
  inject: [igConfiguration.KEY, Store, Protector],
};

@Module({
  imports: [
    ConfigModule.forFeature(igConfiguration),
    StoreModule,
    ProtectorModule,
  ],
  providers: [igClientProvider, IgService],
  exports: [IgService],
})
export class IgModule {}

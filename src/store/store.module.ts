import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import * as redis from 'cache-manager-redis-store';
import { Store } from './store';
import storeConfiguration from './store.configuration';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule.forFeature(storeConfiguration)],
      inject: [storeConfiguration.KEY],
      useFactory: async (config: ConfigType<typeof storeConfiguration>) => {
        if (config.redis) {
          return {
            store: redis,
            host: config.redis.host,
            port: config.redis.port,
            auth_pass: config.redis.password,
            prefix: config.redis.prefix,
          };
        }
      },
    }),
  ],
  providers: [Store],
  exports: [Store],
})
export class StoreModule {}

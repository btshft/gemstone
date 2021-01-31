import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import ttConfiguration from './tt.configuration';
import { TtService } from './tt.service';
import { UrlService } from './url.service';

const ttServiceProvider: Provider = {
  provide: TtService,
  useFactory: (config: ConfigType<typeof ttConfiguration>) => {
    return new TtService(config.sessions);
  },
  inject: [ttConfiguration.KEY],
};

@Module({
  imports: [ConfigModule.forFeature(ttConfiguration)],
  exports: [UrlService, TtService],
  providers: [UrlService, ttServiceProvider],
})
export class TtModule {}

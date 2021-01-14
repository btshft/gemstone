import { Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { Protector } from './protector';
import protectorConfiguration from './protector.configuration';

const protectorProvider: Provider = {
  provide: Protector,
  useFactory: (config: ConfigType<typeof protectorConfiguration>) => {
    return new Protector({ key: config.key });
  },
  inject: [protectorConfiguration.KEY],
};

@Module({
  providers: [protectorProvider],
  exports: [Protector],
  imports: [ConfigModule.forFeature(protectorConfiguration)],
})
export class ProtectorModule {}

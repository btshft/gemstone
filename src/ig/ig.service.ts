import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { IgApiClient } from 'instagram-private-api';
import igConfiguration from './ig.configuration';
import { IgException } from './ig.exception';
import { IG_CLIENT } from './ig.module';

@Injectable()
export class IgService {
  constructor(
    @Inject(IG_CLIENT) private ig: IgApiClient,
    @Inject(igConfiguration) private config: ConfigType<typeof igConfiguration>,
  ) {}

  async authenticate(): Promise<void> {
    await this.ig.simulate.preLoginFlow();
    try {
      await this.ig.account.login(this.config.username, this.config.password);
    } catch (err) {
      throw new IgException(err);
    }
    await this.ig.simulate.postLoginFlow();
  }
}

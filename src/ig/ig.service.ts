import { Injectable, Logger } from '@nestjs/common';
import { Protector } from 'src/protector/protector';
import { Store } from 'src/store/store';
import { IgException } from './ig.exception';
import { IgAugumentedApiClient } from './ig.extensions';
import { IgEncryptedState, IgState } from './models/ig-state.model';

@Injectable()
export class IgService {
  private readonly logger = new Logger(IgService.name);

  constructor(
    private ig: IgAugumentedApiClient,
    private store: Store,
    private protector: Protector,
  ) {}

  async authenticate(): Promise<void> {
    const stateKey = 'ig:state';
    const encryptedState = await this.store.read<IgEncryptedState>(stateKey);
    if (encryptedState) {
      const decryptedState = this.protector.unprotect<IgState>(
        encryptedState.value,
      );

      await this.ig.checkpoint.load(decryptedState);
      this.logger.log({
        message: 'Checkpoint loaded',
        checkpoint: decryptedState,
      });
    }

    await this.ig.simulate.preLoginFlow();
    try {
      await this.ig.account.login(
        this.ig.options.username,
        this.ig.options.password,
      );
    } catch (err) {
      this.logger.error({
        message: 'Authentication failed',
        error: err,
      });

      throw new IgException(err);
    }

    process.nextTick(async () => await this.ig.simulate.postLoginFlow());
    const checkpoint = await this.ig.checkpoint.commit();

    await this.store.write<IgEncryptedState>(stateKey, {
      value: this.protector.protect(checkpoint),
    });

    this.logger.log({ message: 'Checkpoint saved', checkpoint: checkpoint });
    this.logger.log({ message: 'Authentication succeed' });
  }
}

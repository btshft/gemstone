import { Injectable, Logger } from '@nestjs/common';
import {
  IgCheckpointError,
  ReelsMediaFeedResponseItem,
  UserRepositoryInfoResponseUser,
} from 'instagram-private-api';
import { merge } from 'lodash';
import { Observable } from 'rxjs';
import { Store } from 'src/store/store';
import { utc } from 'src/utils/date-time';
import { DeepPartial } from 'src/utils/utility.types';
import { IgAugumentedApiClient } from './ig.extensions';
import { IgAuthStatus, IgState } from './models/ig-state.model';

@Injectable()
export class IgService {
  private readonly logger = new Logger(IgService.name);

  constructor(private ig: IgAugumentedApiClient, private store: Store) {}

  async userId(username: string): Promise<number | undefined> {
    try {
      return await this.ig.user.getIdByUsername(username);
    } catch (err) {
      this.logger.warn({
        message: 'Unable to resolve username -> user.id',
        username: username,
        error: err.message || err,
      });
    }
  }

  async userInfo(
    userId: number | string,
  ): Promise<UserRepositoryInfoResponseUser> {
    try {
      return await this.ig.user.info(userId);
    } catch (err) {
      this.logger.warn({
        message: 'Unable to resolve user.id -> user.info',
        userId: userId,
        error: err.message || err,
      });
    }
  }

  async startChallenge(): Promise<boolean> {
    try {
      this.logger.log({
        message: 'Challenge start',
        checkpoint: this.ig.state.checkpoint || '<null>',
      });

      await this.ig.challenge.auto(true);
    } catch (err) {
      this.logger.error({
        message: 'Unable to start challenge',
        err: err.message || err,
      });

      return false;
    }
  }

  async completeChallenge(code: string): Promise<boolean> {
    try {
      await this.ig.challenge.sendSecurityCode(code);
      this.logger.log({
        message: 'Challenge complete',
        checkpoint: this.ig.state.checkpoint || '<null>',
      });

      return true;
    } catch (err) {
      this.logger.error({
        message: 'Unable to complete challenge',
        err: err.message || err,
      });

      return false;
    }
  }

  stories$(userId: string | number): Observable<ReelsMediaFeedResponseItem[]> {
    const feed = this.ig.feed.reelsMedia({
      userIds: [userId],
    });

    return feed.observable();
  }

  async authenticate(): Promise<IgAuthStatus> {
    const updateState = async (
      status: IgAuthStatus | IgState,
    ): Promise<void> => {
      const update =
        typeof status === 'string'
          ? {
              auth: {
                status: status,
                updated: utc(),
              },
            }
          : status;

      await this.state(update);
    };

    const completeLogin = async (): Promise<void> => {
      try {
        await this.ig.simulate.postLoginFlow();
      } catch (err) {
        this.logger.error({
          message: 'Post-login failed',
          reason: err.message || err,
        });
      }
    };

    try {
      await this.ig.simulate.preLoginFlow();
      await this.ig.account.login(
        this.ig.options.username,
        this.ig.options.password,
      );

      process.nextTick(completeLogin);
      await updateState('authenticated');
      return 'authenticated';
    } catch (err) {
      this.logger.error({
        message: 'Authentication failed',
        reason: err.message || err,
      });

      const isCheckpoint = err instanceof IgCheckpointError;
      if (isCheckpoint) {
        await updateState({
          auth: {
            status: 'challenge_required',
            updated: utc(),
          },
          challenge: {
            status: 'required',
            updated: utc(),
          },
        });
        return 'challenge_required';
      } else {
        await updateState('failed');
        return 'failed';
      }
    }
  }

  async state(
    update?: Partial<IgState>,
  ): Promise<IgState | DeepPartial<IgState>> {
    const key = 'ig:state:user';
    const empty: DeepPartial<IgState> = {
      challenge: {
        status: 'unknown',
      },
      auth: {
        status: 'unknown',
      },
    };

    const current = await this.store.read<IgState>(key);
    if (update) {
      const source = current || empty;
      const result = merge(source, update);

      await this.store.write<IgState>(key, result);
      return result;
    }

    return current || empty;
  }
}

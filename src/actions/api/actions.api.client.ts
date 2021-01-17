import { HttpService, Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Action, ActionTypes } from '../actions.types';
import actionsApiConfiguration from './actions.api.configuration';

@Injectable()
export class ActionsClient {
  constructor(
    private http: HttpService,
    @Inject(actionsApiConfiguration.KEY)
    private config: ConfigType<typeof actionsApiConfiguration>,
  ) {}

  async action<TKey extends ActionTypes>(action: Action<TKey>): Promise<void> {
    const url = `${this.config.apiBaseUrl}/actions`;
    await this.http.post(url, action).toPromise();
  }
}

/* eslint-disable @typescript-eslint/ban-types */

import { SceneContextMessageUpdate } from 'telegraf/typings/stage';
import { AppContext } from './app/app.context';
import { DialogRouter } from './dialog-wizard/dialog.router';
import { DialogUi } from './dialog-wizard/dialog.ui';
import { StateMachineAccessor } from './fsm/fsm.context';

export interface BotContext extends SceneContextMessageUpdate {
  ui: DialogUi;
  router: DialogRouter;
  session: Record<string, any>;
  app: AppContext;
  fsm: StateMachineAccessor;
}

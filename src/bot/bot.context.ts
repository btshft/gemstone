/* eslint-disable @typescript-eslint/ban-types */

import { SceneContextMessageUpdate } from 'telegraf/typings/stage';
import { AppContext } from './app-context/app.context';
import { DialogWizard } from './dialog-wizard/dialog.wizard';
import { StateMachineAccessor } from './fsm/fsm.context';

export interface BotContext extends SceneContextMessageUpdate {
  dialog: DialogWizard;
  session: any;
  app: AppContext;
  fsm: StateMachineAccessor;
}

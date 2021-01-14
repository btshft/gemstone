/* eslint-disable @typescript-eslint/ban-types */

import { SceneContextMessageUpdate } from 'telegraf/typings/stage';
import { DialogWizard } from './wizard/dialog.wizard';

export interface BotContext extends SceneContextMessageUpdate {
  dialog: DialogWizard;
  session: any;
}

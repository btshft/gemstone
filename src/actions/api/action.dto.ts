import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Action, ActionTypes } from '../actions.types';

export class ActionDto<T extends ActionTypes> {
  @ApiProperty({
    type: typeof Action<T>
  })
  payload: Action<any>;
}

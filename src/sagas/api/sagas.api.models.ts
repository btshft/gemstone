import { ApiProperty } from '@nestjs/swagger';
import { AnySaga, SagaCreate } from '../saga.types';

export class CreateSaga<TSaga extends AnySaga = AnySaga> {
  constructor(init?: Partial<CreateSaga<TSaga>>) {
    if (init) Object.assign(this, init);
  }

  @ApiProperty()
  public saga: SagaCreate<TSaga>;
}

export class ProcessSaga {
  @ApiProperty()
  public sagaId: string;
}

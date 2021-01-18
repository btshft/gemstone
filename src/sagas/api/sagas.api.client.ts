import { HttpService, Injectable } from '@nestjs/common';
import { SagaCreate, AnySaga } from '../saga.types';
import { CreateSaga, ProcessSaga } from './sagas.api.models';

@Injectable()
export class SagaClient {
  constructor(private http: HttpService) {}

  async create<T extends AnySaga>(request: SagaCreate<T>): Promise<any> {
    await this.http
      .post(
        'sagas/create',
        new CreateSaga<T>({ saga: request }),
      )
      .toPromise();
  }

  async process(request: ProcessSaga): Promise<any> {
    await this.http.post('sagas/process', request).toPromise();
  }
}

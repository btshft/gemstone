import { TObject } from 'src/utils/utility.types';

export class StoriesTask<TRequest extends TObject> {
  public name: string;
  public jobId: number | string;
  public request: TRequest;

  constructor(init?: Partial<StoriesTask<TRequest>>) {
    if (init) {
      Object.assign(this, init);
    }
  }
}

import { Mutex } from 'async-mutex';

class ResourceMutex extends Mutex {
  constructor(public refs: number, public resource: string) {
    super();
  }
}

export class MutexReleaser {
  constructor(private mutex: Mutex, private callback: () => Promise<void>) {}

  async release(): Promise<void> {
    if (this.mutex.isLocked()) this.mutex.release();

    try {
      await this.callback();
    } catch (err) {
      console.log({
        message: `Failed to run callback`,
      });
    }
  }
}

export class ResourceLock {
  private readonly resources: Map<string, ResourceMutex> = new Map();
  private readonly sync: Mutex = new Mutex();

  async acquire(key: string): Promise<MutexReleaser> {
    if (!key) throw new Error('Key cannot be null');
    try {
      await this.sync.acquire();
      if (this.resources.has(key)) {
        const mutex = this.resources.get(key);
        mutex.refs += 1;
        return new MutexReleaser(mutex, this.createReturner(mutex));
      } else {
        const mutex = new ResourceMutex(1, key);
        this.resources.set(key, mutex);
        return new MutexReleaser(mutex, this.createReturner(mutex));
      }
    } finally {
      if (this.sync.isLocked) this.sync.release();
    }
  }

  private createReturner(mutex: ResourceMutex): () => Promise<void> {
    return async () => {
      await this.return(mutex);
    };
  }

  private async return(mutex: ResourceMutex): Promise<void> {
    try {
      await this.sync.acquire();
      if (this.resources.has(mutex.resource)) {
        mutex.refs -= 1;
        if (mutex.refs === 0) {
          this.resources.delete(mutex.resource);
        }
      }
    } finally {
      if (this.sync.isLocked) this.sync.release();
    }
  }
}

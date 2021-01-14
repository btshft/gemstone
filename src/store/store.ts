import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { TObject } from 'src/utils/utility.types';

@Injectable()
export class Store {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async read<T extends TObject>(key: string): Promise<T | undefined> {
    const result = await this.cache.get<T>(key);
    return result || undefined;
  }

  async write<T extends TObject>(key: string, value: T): Promise<unknown> {
    return await this.cache.set(key, value, { ttl: Infinity });
  }
}

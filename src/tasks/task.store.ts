import { Injectable } from '@nestjs/common';
import { TObject } from 'src/utils/utility.types';

export type Task<T extends TObject, TState = string> = {
  key: string;
  region: string;
  status: TState;
  extension: T;
  text: string;
};

type Region = string;
type Key = string;
type TasksStore = Record<Key, Task<any, any>>;

@Injectable()
export class TaskStore {
  private readonly store: Map<Region, TasksStore> = new Map();

  many<T extends Task<any, any>>(region: string): T[] {
    const tasks = this.store.get(region);
    return <T[]>(tasks ? Object.entries(tasks).map(([, v]) => v) : []);
  }

  single<T extends Task<any, any>>(region: string, key: string): T | undefined {
    const tasks = this.store.get(region);
    return <T | undefined>(tasks ? tasks[key] : undefined);
  }

  update<T extends Task<any, any>>(task: Partial<T>): T {
    const region = this.store.get(task.region);
    if (!region) throw new Error(`Region ${task.region} not exists`);

    const source = region[task.key];
    if (!source) throw new Error(`Task ${task.region}:${task.key} not exists`);

    region[task.key] = {
      ...task,
      ...source,
    };

    return <T>region[task.key];
  }

  create<T extends Task<any, any>>(task: T): T {
    const region = this.store.get(task.region);
    if (!region) {
      this.store.set(task.region, {});
    }

    region[task.key] = task;
    return task;
  }

  delete(region: string, key: string): boolean {
    const tasks = this.store.get(region);
    if (key in tasks) {
      delete tasks[key];
      return true;
    }

    return false;
  }
}

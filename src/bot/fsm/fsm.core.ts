import { MetadataScanner, Reflector } from '@nestjs/core';
import {
  Action,
  Guard,
  Machine,
  reduce,
  Reducer,
  SendEvent,
  Service,
  transition,
  Transition,
} from 'robot3';
import { BotContext } from '../bot.context';
import { STATE_METADATA } from './fsm.metadata';

export function activate<C, E>(
  event: string,
  state: string,
  ...args: (Reducer<C, E> | Guard<C, E> | Action<C, E>)[]
): Transition {
  const $reducer = reduce<C, E>((c, e) => {
    if (typeof e === 'object') {
      const copy: { type: string } = <any>{ ...e };
      delete copy.type;
      return { ...c, ...copy };
    }
    return c;
  });

  return transition(event, state, ...[...args, $reducer]);
}

export type StateActivator<M extends Machine = Machine> = {
  service: Service<M>;
  send(activation: SendEvent): Promise<void>;
};

export function useActivator<T, C, R extends InstanceType<any>>(
  service: Service<Machine<T, C>>,
  bot: BotContext,
  renderer: R,
): StateActivator<Machine<T, C>> {
  const scanner = new MetadataScanner();
  const reflector = new Reflector();
  const prototype = Object.getPrototypeOf(renderer);
  const callbacks = new Map<string, string>();

  scanner.scanFromPrototype(renderer, prototype, (name) => {
    const methodRef = prototype[name];
    const metadata = reflector.get(STATE_METADATA, methodRef);
    if (metadata) {
      const { state } = metadata;
      callbacks.set(state, name);
    }
  });

  const $render = async (service: Service<Machine<T, C>>): Promise<void> => {
    const { machine, context } = service;
    const callback = callbacks.get(service.machine.current);

    if (!callback) return;

    await Promise.resolve(renderer[callback](bot, context, machine));
  };

  const $original = service['send'];
  const $async = async (event: SendEvent): Promise<void> => {
    $original(event);
    await $render(service);
  };

  return {
    service: service,
    async send(activation: SendEvent): Promise<void> {
      await $async(activation);
    },
  };
}

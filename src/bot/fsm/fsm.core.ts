import { Logger } from '@nestjs/common';
import { MetadataScanner, Reflector } from '@nestjs/core';
import { merge } from 'lodash';
import {
  Action,
  Guard,
  Immediate,
  Machine,
  MachineState,
  reduce,
  Reducer,
  SendEvent,
  Service,
  state,
  transition,
  Transition,
} from 'robot3';
import { DeepPartial, TObject } from 'src/utils/utility.types';
import { BotContext } from '../bot.context';
import { STATE_METADATA } from './fsm.metadata';

export type StateActivationContext<C extends TObject> = DeepPartial<C>;
export type MachineStates = Record<string, MachineState>;

export function state$(...args: (Transition | Immediate)[]): MachineState {
  return state(...[...args, transition('internal:exception', '$exception')]);
}

export function transition$<C, E>(
  event: string,
  state: string,
  ...args: (Reducer<C, E> | Guard<C, E> | Action<C, E>)[]
): Transition {
  const $reducer = reduce<C, E>((c, e) => {
    if (typeof e === 'object') {
      const copy: { type: string } = <any>{ ...e };
      delete copy.type;
      return merge({}, c, copy);
    }
    return c;
  });

  return transition(event, state, ...[...args, $reducer]);
}

export type StateActivator<C extends TObject, S extends MachineStates> = {
  service: Service<Machine<S, C>>;
  send(action: string, context?: StateActivationContext<C>): Promise<void>;
};

export function useActivator<
  C extends TObject,
  S extends MachineStates,
  R extends InstanceType<any>
>(
  service: Service<Machine<S, C>>,
  bot: BotContext,
  renderer: R,
): StateActivator<C, S> {
  const scanner = new MetadataScanner();
  const reflector = new Reflector();
  const prototype = Object.getPrototypeOf(renderer);
  const callbacks = new Map<string, string>();
  const logger = new Logger(`StateMachine[${(<any>renderer).name}]`);

  scanner.scanFromPrototype(renderer, prototype, (name) => {
    const methodRef = prototype[name];
    const metadata = reflector.get(STATE_METADATA, methodRef);
    if (metadata) {
      const { state } = metadata;
      callbacks.set(state, name);
    }
  });

  const $render = async (service: Service<Machine<S, C>>): Promise<void> => {
    const { machine, context } = service;
    const callback = callbacks.get(service.machine.current);

    if (!callback) return;

    await Promise.resolve(renderer[callback](bot, context, machine));
  };

  const $original = service['send'];
  const $async = async (event: SendEvent): Promise<void> => {
    $original(event);

    try {
      await $render(service);
    } catch (err) {
      logger.error({
        message: err.message || 'unknown',
        error: err,
      });
      await $async({
        type: 'internal:exception',
      });
    }
  };

  return <StateActivator<C, S>>{
    service: service,
    async send(
      action: string,
      context?: StateActivationContext<C>,
    ): Promise<void> {
      await $async({ ...context, type: action });
    },
  };
}

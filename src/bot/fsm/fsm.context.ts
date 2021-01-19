import {
  Machine,
  MachineState,
  interpret,
  createMachine,
  Service,
} from 'robot3';
import { MiddlewareFn } from 'telegraf/typings/composer';
import { BotContext } from '../bot.context';
import { StateActivator, useActivator } from './fsm.core';

export interface StateMachineAccessor {
  create<S, M extends Machine>(
    name: string,
    states: { [K in keyof S]: MachineState },
    renderer: InstanceType<any>,
  ): StateActivator<M>;

  get<M extends Machine>(name: string): StateActivator<M>;
}

class _StateMachineAccessor implements StateMachineAccessor {
  public bot: BotContext;

  create<S, M extends Machine>(
    name: string,
    states: { [K in keyof S]: MachineState },
    renderer: InstanceType<any>,
  ): StateActivator<M> {
    const service = interpret(createMachine(<any>states), () => {
      // intentionally empty
    });

    this.bot.session[`__sm_${name}__`] = {
      service,
      renderer,
    };

    return <StateActivator<M>>useActivator(service, this.bot, renderer);
  }

  get<M extends Machine>(name: string): StateActivator<M> {
    const state: { service: Service<any>; renderer: any } = this.bot.session[
      `__sm_${name}__`
    ];

    return <StateActivator<M>>(
      useActivator(state.service, this.bot, state.renderer)
    );
  }
}

export function fsm(): MiddlewareFn<BotContext> {
  return async function (ctx, next) {
    if (!ctx.fsm) {
      const accessor = new _StateMachineAccessor();
      accessor.bot = ctx;

      ctx.fsm = accessor;
    }

    return await next();
  };
}

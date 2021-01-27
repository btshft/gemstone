import { interpret, createMachine, Service } from 'robot3';
import { TObject } from 'src/utils/utility.types';
import { MiddlewareFn } from 'telegraf';
import { BotContext } from '../bot.context';
import { MachineStates, StateActivator, useActivator } from './fsm.core';

export interface StateMachineAccessor {
  create<C extends TObject = TObject, S extends MachineStates = MachineStates>(
    name: string,
    states: MachineStates,
    renderer: InstanceType<any>,
  ): StateActivator<C, S>;

  get<C extends TObject = TObject>(
    name: string,
  ): StateActivator<C, MachineStates>;
}

class _StateMachineAccessor implements StateMachineAccessor {
  public bot: BotContext;

  create<C extends TObject = TObject, S extends MachineStates = MachineStates>(
    name: string,
    states: MachineStates,
    renderer: InstanceType<any>,
  ): StateActivator<C, S> {
    const service = interpret(createMachine(<any>states), () => {
      // intentionally empty
    });

    this.bot.session[`__sm_${name}__${this.bot.chat.id}`] = {
      service,
      renderer,
    };

    return <StateActivator<C, S>>useActivator(service, this.bot, renderer);
  }

  get<C extends TObject = TObject>(
    name: string,
  ): StateActivator<C, MachineStates> {
    const state: { service: Service<any>; renderer: any } = this.bot.session[
      `__sm_${name}__${this.bot.chat.id}`
    ];

    return <StateActivator<C, MachineStates>>(
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

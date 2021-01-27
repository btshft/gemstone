import { Injectable } from '@nestjs/common';
import { Prisma } from 'src/database/services/prisma';
import { OutboxWriter } from 'src/outbox/outbox.writer';
import { utc } from 'src/utils/date-time';
import {
  AnySaga,
  SagaCreate,
  SagaMetadata,
  SagaState,
  SagaTypes,
} from './saga.types';

@Injectable()
export class SagaService {
  constructor(private prisma: Prisma, private outbox: OutboxWriter) {}

  async create<TType extends AnySaga = AnySaga>(
    request: SagaCreate<TType>,
  ): Promise<void> {
    const { id } = await this.prisma.saga.create({
      data: {
        state: <string>request.state,
        metadata: <any>request.metadata,
        type: request.type,
        createdAt: utc(),
        activityId: request.activityId,
        initiator: {
          connect: {
            id: request.initiatorId,
          },
        },
      },
      select: {
        id: true,
      },
    });

    await this.process(id);
  }

  async activeExists(
    initiatorId: string,
    activityId: string,
  ): Promise<boolean> {
    const count = await this.prisma.saga.count({
      where: {
        activityId: activityId,
        initiatorId: initiatorId,
        faultedAt: null,
        completedAt: null,
      },
      take: 1,
    });

    return count > 0;
  }

  async complete(sagaId: string, error?: string): Promise<void> {
    const saga = await this.prisma.saga.findUnique({
      where: {
        id: sagaId,
      },
    });

    if (!saga) throw new Error(`Saga '${sagaId}' not found`);
    await this.prisma.saga.update({
      where: {
        id: saga.id,
      },
      data: {
        completedAt: utc(),
        faultedAt: error ? utc() : undefined,
        fault: error ? error : undefined,
      },
    });
  }

  async move<
    TType extends AnySaga = AnySaga,
    TState extends SagaState<TType> = SagaState<TType>
  >(sagaId: string, state: TState, metadata: SagaMetadata<TType, TState>) {
    const saga = await this.prisma.saga.findUnique({
      where: {
        id: sagaId,
      },
    });

    if (!saga) throw new Error(`Saga '${sagaId}' not found`);
    if (saga.completedAt || saga.faultedAt) {
      throw new Error(`Saga '${sagaId}' is completed or faulted`);
    }

    await this.prisma.saga.update({
      where: {
        id: saga.id,
      },
      data: {
        state: state,
        metadata: <any>metadata,
        transitionAt: utc(),
      },
    });
  }

  async process(sagaId: string): Promise<void> {
    const saga = await this.prisma.saga.findUnique({
      where: {
        id: sagaId,
      },
      select: {
        id: true,
        type: true,
        completedAt: true,
        faultedAt: true,
      },
    });

    if (!saga) {
      throw new Error(`Saga '${sagaId}' not found`);
    }

    if (saga.completedAt || saga.faultedAt) {
      throw new Error(`Saga '${sagaId}' is completed or faulted`);
    }

    await this.outbox.write({
      type: 'outbox:saga',
      value: {
        sagaId: saga.id,
        sagaType: <SagaTypes>saga.type,
      },
    });
  }
}

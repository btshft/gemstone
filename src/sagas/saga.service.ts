import { Injectable } from '@nestjs/common';
import { JsonObject } from '@prisma/client';
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
export class SagaService<TType extends AnySaga = AnySaga> {
  constructor(private prisma: Prisma, private outbox: OutboxWriter) {}

  async create(request: SagaCreate<TType>): Promise<void> {
    const { id } = await this.prisma.saga.create({
      data: {
        state: <string>request.state,
        metadata: request.metadata,
        type: request.type,
        createdAt: utc(),
      },
      select: {
        id: true,
      },
    });

    await this.process(id);
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

  async move<TState extends SagaState<TType>>(
    sagaId: string,
    state: TState,
    metadata: SagaMetadata<TType, TState>,
  ) {
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
        state: state,
        metadata: <JsonObject>metadata,
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

import { Injectable } from '@nestjs/common';
import { Outbox } from '@prisma/client';
import { Prisma } from 'src/database/services/prisma';
import { OutboxMetadata, OutboxTyped, OutboxTypes } from './outbox.types';

@Injectable()
export class OutboxWriter {
  constructor(private prisma: Prisma) {}

  async write<T extends OutboxTypes>(
    outbox: OutboxTyped<T>,
    metadata?: Partial<OutboxMetadata<T>>,
  ): Promise<Outbox> {
    return await this.prisma.outbox.create({
      data: {
        content: <any>outbox,
        metadata: metadata || {},
      },
    });
  }
}

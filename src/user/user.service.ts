import { Injectable } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { createHash } from 'crypto';
import { addMinutes } from 'date-fns';
import { Prisma } from 'src/database/services/prisma';
import { utc } from 'src/utils/date-time';
import { v4 as uuid } from 'uuid';

const TOKEN_TTL_MINUTES = 15;

@Injectable()
export class UserService {
  constructor(private prisma: Prisma) {}

  async issueRegistrationToken(roles: RoleName[]): Promise<string> {
    const token = uuid();
    const hash = createHash('sha256').update(token).digest('hex');

    const { value } = await this.prisma.registrationToken.create({
      data: {
        value: hash,
        roles: roles,
        expiration: addMinutes(utc(), TOKEN_TTL_MINUTES),
      },
    });

    return value;
  }

  async validateRegistrationToken(token: string): Promise<boolean> {
    // eslint-disable-next-line prettier/prettier
    const tokenRef = await this.prisma.registrationToken.findUnique({
      where: {
        value: token,
      },
      select: {
        id: true,
        expiration: true,
        userId: true,
      },
    });

    if (!tokenRef) return false;

    // Token already used;
    if (tokenRef.userId) return false;

    // Expired
    if (tokenRef.expiration && tokenRef.expiration < utc()) return false;

    return true;
  }

  async userExists(telegramUserId: string | number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: {
        telegramUserId: String(telegramUserId),
      },
    });

    return !!user;
  }

  async revokeRegistrationToken(token: string): Promise<boolean> {
    const tokenRef = await this.prisma.registrationToken.findUnique({
      where: {
        value: token,
      },
      select: {
        id: true,
      },
    });

    if (tokenRef) {
      await this.prisma.registrationToken.delete({
        where: {
          id: tokenRef.id,
        },
      });

      return true;
    }

    return false;
  }

  async createUser(
    token: string,
    telegramUsername: string,
    telegramUserId: string | number,
  ): Promise<string> {
    const valid = await this.validateRegistrationToken(token);
    if (!valid) throw new Error('Token not valid');

    const user = await this.prisma.user.findUnique({
      where: {
        telegramUserId: String(telegramUserId),
      },
    });

    if (user)
      throw new Error(`User with tg:id ${telegramUserId} already exists`);

    const tokenRef = await this.prisma.registrationToken.findUnique({
      where: {
        value: token,
      },
      select: {
        roles: true,
      },
    });

    const roleRefs = await this.prisma.role.findMany({
      where: {
        name: {
          in: tokenRef.roles,
        },
      },
      select: {
        id: true,
      },
    });

    const { userId } = await this.prisma.registrationToken.update({
      where: {
        value: token,
      },
      data: {
        user: {
          create: {
            telegramUserId: String(telegramUserId),
            telegramUsername: telegramUsername,
            roles: {
              connect: roleRefs.map((r) => ({
                id: r.id,
              })),
            },
          },
        },
      },
      select: {
        userId: true,
      },
    });

    return userId;
  }
}

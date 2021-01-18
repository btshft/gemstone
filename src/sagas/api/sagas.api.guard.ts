import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import sagasApiConfiguration from './sagas.api.configuration';

export class SagasApiGuard implements CanActivate {
  constructor(
    @Inject(sagasApiConfiguration.KEY)
    private config: ConfigType<typeof sagasApiConfiguration>,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();

    const apiKeys = request.headers['x-api-key'];
    if (!apiKeys || !apiKeys.length) {
      return false;
    }

    const apiKey = typeof apiKeys === 'string' ? apiKeys : apiKeys[0];
    if (apiKey != this.config.apiKey) {
      return false;
    }

    return true;
  }
}

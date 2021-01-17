import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import actionsApiConfiguration from './actions.api.configuration';

@Injectable()
export class ActionsGuard implements CanActivate {
  constructor(
    @Inject(actionsApiConfiguration.KEY)
    private config: ConfigType<typeof actionsApiConfiguration>,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const apiKey = request.headers['X-Api-Key'][0];
    if (!apiKey || apiKey != this.config.apiKey) {
      return false;
    }

    return true;
  }
}

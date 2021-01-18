import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';
import { SagaService } from '../saga.service';
import { SagasApiGuard } from './sagas.api.guard';
import { CreateSaga, ProcessSaga } from './sagas.api.models';

@Controller('sagas')
@UseGuards(SagasApiGuard)
@ApiSecurity('X-Api-Key')
export class SagasController {
  constructor(private sagaService: SagaService) {}

  @Post('create')
  async create(@Body() request: CreateSaga): Promise<any> {
    await this.sagaService.create(request.saga);
    return {};
  }

  @Post('process')
  async process(@Body() request: ProcessSaga): Promise<any> {
    await this.sagaService.process(request.sagaId);
    return {};
  }
}

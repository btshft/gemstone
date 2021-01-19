import { SetMetadata } from '@nestjs/common';

export const STATE_METADATA = Symbol('design:state');

export function State(name: string): MethodDecorator {
  return SetMetadata(STATE_METADATA, {
    state: name,
  });
}

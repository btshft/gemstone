import { Injectable } from '@nestjs/common';
import Cryptr from 'cryptr';
import { TObject } from 'src/utils/utility.types';

export type ProtectorOptions = {
  key: string;
};

@Injectable()
export class Protector {
  private crypto: Cryptr;

  constructor(options: ProtectorOptions) {
    this.crypto = new Cryptr(options.key);
  }

  protect<T extends TObject>(value: T): string {
    return this.crypto.encrypt(JSON.stringify(value));
  }

  unprotect<T extends TObject>(encrypted: string): T {
    return <T>JSON.parse(this.crypto.decrypt(encrypted));
  }
}

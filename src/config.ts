import { readdirSync } from 'fs';
import { resolve } from 'path';

import {
  ConfigModule as BaseConfigModule,
  ConfigService as BaseConfigService,
  registerAs,
} from '@nestjs/config';

import type { DynamicModule } from '@nestjs/common';

const ROOT_DIR = 'dist';

export const ConfigModule = {
  forRoot: (dir = 'configs'): DynamicModule =>
    BaseConfigModule.forRoot({
      isGlobal: true,
      load: readdirSync(resolve(ROOT_DIR, dir))
        .filter((file) => !file.includes('index.js'))
        .map((file) =>
          registerAs(
            file.replace('.js', '').toUpperCase(),
            () => import(resolve(ROOT_DIR, dir, file)),
          ),
        ),
    }),
};

export class ConfigService extends BaseConfigService {
  get<T>(propertyPath: string): T {
    return super.get(propertyPath) as T;
  }
}

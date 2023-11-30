import { readdirSync } from 'fs';
import { resolve } from 'path';

import {
  ConfigModule as BaseConfigModule,
  ConfigService,
  registerAs,
} from '@nestjs/config';

import type { DynamicModule } from '@nestjs/common';

const ROOT_DIR = 'dist';
const CONFIG_DIR = 'configs';

export const ConfigModule = {
  forRoot: (): DynamicModule =>
    BaseConfigModule.forRoot({
      isGlobal: true,
      load: readdirSync(resolve(ROOT_DIR, CONFIG_DIR))
        .filter((file) => !file.includes('index.js'))
        .map((file) =>
          registerAs(
            file.replace('.js', '').toUpperCase(),
            () => import(resolve(ROOT_DIR, CONFIG_DIR, file)),
          ),
        ),
    }),
};

export { ConfigService };

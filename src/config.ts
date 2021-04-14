import { readdirSync } from 'fs';
import { resolve } from 'path';

import {
  ConfigModule as Config,
  ConfigService,
  registerAs,
} from '@nestjs/config';

import type { DynamicModule } from '@nestjs/common';

const ROOT_DIR = 'dist';

export const ConfigModule = {
  forRoot: (dir = 'configs'): DynamicModule =>
    Config.forRoot({
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

export { ConfigService };

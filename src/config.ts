import { readdirSync } from 'fs';
import { join } from 'path';

import {
  ConfigModule as Config,
  ConfigService,
  registerAs,
} from '@nestjs/config';

import type { DynamicModule } from '@nestjs/common';

export const ConfigModule = {
  forRoot: (dir = 'configs'): DynamicModule =>
    Config.forRoot({
      isGlobal: true,
      load: readdirSync(join(__dirname, dir))
        .filter((file) => !file.includes('index.js'))
        .map((file) =>
          registerAs(
            file.replace('.js', '').toUpperCase(),
            () => import(join(__dirname, dir, file)),
          ),
        ),
    }),
};

export { ConfigService };

import minimist = require('minimist');
import { getWorkspace } from './workspace';
import { concatMap } from 'rxjs/operators';
import { Architect } from '@angular-devkit/architect';
import { Logger } from '@angular-devkit/core/src/logger';

export const architectCommand = (target: string, logger: Logger) => (args: minimist.ParsedArgs) => {
  getWorkspace()
    .pipe(
      concatMap(ws => new Architect(ws).loadArchitect()),
      concatMap(architect => {
        const project = args._.shift()!;
        const configuration = args.configuration || (args.prod && 'production');
        const overrides = { ...args };
        delete overrides['_'];
        delete overrides.configuration;
        delete overrides.prod;

        const targetSpec = {
          project,
          target,
          configuration,
          overrides
        };

        const builderConfig = architect.getBuilderConfiguration(targetSpec);

        return architect.run(builderConfig, { logger });
      })
    )
    .subscribe({
      error: (err: Error) => {
        logger.fatal(err.message);
        if (err.stack) {
          logger.fatal(err.stack);
        }
        process.exit(1);
      }
    });
};

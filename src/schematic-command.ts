import { normalize, virtualFs, JsonObject } from '@angular-devkit/core';
import { ParsedArgs } from 'minimist';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { NodeWorkflow } from '@angular-devkit/schematics/tools';
import { Logger } from '@angular-devkit/core/src/logger';
import { getWorkspace } from './workspace';
import { map, concatMap } from 'rxjs/operators';

export const schematicCommand = (logger: Logger) => (args: ParsedArgs) => {
  const parsedArgs = { ...args };
  const schematic = parsedArgs._.shift()!;

  /** Create a Virtual FS Host scoped to where the process is being run. **/
  const fsHost = new virtualFs.ScopedHost(new NodeJsSyncHost(), normalize(process.cwd()));

  /** Create the workflow that will be executed with this run. */
  const workflow = new NodeWorkflow(fsHost, {});

  // Pass the rest of the arguments as the smart default "argv". Then delete it.
  workflow.registry.addSmartDefaultProvider('argv', (schema: JsonObject) => {
    if ('index' in schema) {
      return args._[Number(schema['index'])];
    } else {
      return args._;
    }
  });

  delete parsedArgs._;

  getWorkspace()
    .pipe(
      map(ws => {
        return {
          collection: '@schematics/angular',
          schematic,
          options: {
            ...parsedArgs,
            project: ws.getDefaultProjectName()
          },
          logger
        };
      }),
      concatMap(options => {
        return workflow.execute(options);
      })
    )
    .subscribe({
      error: e => {
        throw e;
      }
    });
};

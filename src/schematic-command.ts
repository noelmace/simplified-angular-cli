import { experimental, normalize, virtualFs, JsonObject } from '@angular-devkit/core';
import { ParsedArgs } from 'minimist';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { NodeWorkflow } from '@angular-devkit/schematics/tools';
import { Logger } from '@angular-devkit/core/src/logger';
import { getWorkspace } from './workspace';
import { map, concatMap, tap } from 'rxjs/operators';
import { cwd } from './workarounds';

function getProjectByCwd(workspace: experimental.workspace.Workspace): string | null {
  try {
    return workspace.getProjectByPath(normalize(cwd()));
  } catch (e) {
    console.log('bar');
    if (e instanceof experimental.workspace.AmbiguousProjectPathException) {
      return workspace.getDefaultProjectName();
    }
    throw e;
  }
}

function getSchematicCollection(workspace: experimental.workspace.Workspace): string {
  if (workspace) {
    const project = getProjectByCwd(workspace);
    if (project && workspace.getProjectCli(project)) {
      const value = workspace.getProjectCli(project)['defaultCollection'];
      if (typeof value == 'string') {
        return value;
      }
    }
    if (workspace.getCli()) {
      const value = workspace.getCli()['defaultCollection'];
      if (typeof value == 'string') {
        return value;
      }
    }
  }

  if (workspace && workspace.getCli()) {
    const value = workspace.getCli()['defaultCollection'];
    if (typeof value == 'string') {
      return value;
    }
  }

  return '@schematics/angular';
}

function parseSchematicInfo(schematicName: string, workspace: experimental.workspace.Workspace): [string, string] {
  let collectionName = getSchematicCollection(workspace);

  if (schematicName) {
    if (schematicName.includes(':')) {
      [collectionName, schematicName] = schematicName.split(':', 2);
    }
  }

  return [collectionName, schematicName];
}

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
        const [collectionName, schematicName] = parseSchematicInfo(schematic, ws);

        return {
          collection: collectionName,
          schematic: schematicName,
          options: {
            ...parsedArgs,
            project: getProjectByCwd(ws)
          },
          logger
        };
      }),
      tap(console.log),
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

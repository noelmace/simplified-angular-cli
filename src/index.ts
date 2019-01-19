import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import * as path from 'path';
import { experimental, normalize, dirname } from '@angular-devkit/core';
import { NodeJsSyncHost, createConsoleLogger } from '@angular-devkit/core/node';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Architect } from '@angular-devkit/architect';
import * as minimist from 'minimist';

const logger = createConsoleLogger(true);

function findUp(name: string, from: string) {
  const root = path.parse(from).root;

  let currentDir = from;
  while (currentDir && currentDir !== root) {
    const possiblePath = path.join(currentDir, name);
    if (existsSync(possiblePath)) {
      return possiblePath;
    }

    currentDir = path.dirname(currentDir);
  }

  return null;
}

function getWorkspace(): Observable<experimental.workspace.Workspace> {
  const configFilePath = findUp('angular.json', process.cwd());
  if (configFilePath === null) {
    throw new Error(
      `This command requires to be run in an Angular project, but a project definition could not be found.`
    );
  }
  const root = dirname(normalize(configFilePath));
  const configContent = readFileSync(configFilePath, 'utf-8');
  const workspaceJson = JSON.parse(configContent);

  const host = new NodeJsSyncHost();
  const workspace = new experimental.workspace.Workspace(root, host);

  return workspace.loadWorkspaceFromJson(workspaceJson);
}

const architectCommand = (target: string) => (args: minimist.ParsedArgs) => {
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

interface CommandMap {
  [key: string]: (args: minimist.ParsedArgs) => any;
}

const architectCommandMap = ['build', 'serve', 'lint', 'serve', 'test' /* , 'e2e', 'xi18n' */].reduce(
  (acc, name) => {
    acc[name] = architectCommand(name);
    return acc;
  },
  {} as CommandMap
);

const commandMap: CommandMap = {
  help: () => {
    console.log(`everything looks fine, you do not need help`);
  },
  ...architectCommandMap
};

function runCommand(args: string[]) {
  const commandName: string = args.shift()!;
  if (!commandName || !(commandName in commandMap)) {
    throw new Error('Unable to find a command to run');
  }
  const argv = minimist(args);

  const command = commandMap[commandName];
  command(argv);
}

if (process.argv.length < 1) {
  console.error('use a command');
  process.exit(1);
}

try {
  runCommand(process.argv.slice(2));
} catch (err) {
  if (err && err.message) {
    console.log(err.message);
  } else {
    throw err;
  }
}

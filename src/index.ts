import { readFileSync } from 'fs';
import { existsSync } from 'fs';
import * as path from 'path';

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

function getWorkspaceConfig(): any {
  const configFilePath = findUp('angular.json', process.cwd());
  if (configFilePath === null) {
    throw new Error(`This command requires to be run in an Angular project, but a project definition could not be found.`);
  }

  const config = readFileSync(configFilePath, 'UTF-8');
  return JSON.parse(config);
}

const commandMap: { [key: string]: () => any } = {
  help: () => {
    console.log(`everything looks fine, you do not need help`);
  },
  build: () => {
    const config = getWorkspaceConfig();
    console.log(config);
  }
};

function runCommand(args: string[]) {
  const commandName: string = args.shift()!;
  if (!commandName || !(commandName in commandMap)) {
    throw new Error('Unable to find a command to run');
  }
  const command = commandMap[commandName];
  command();
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

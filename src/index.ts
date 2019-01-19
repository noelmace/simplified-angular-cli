import { createConsoleLogger } from '@angular-devkit/core/node';
import * as minimist from 'minimist';
import { architectCommand } from './architect-command';
import { schematicCommand } from './schematic-command';

const logger = createConsoleLogger(true);

interface CommandMap {
  [key: string]: (args: minimist.ParsedArgs) => any;
}

const architectCommandMap = ['build', 'serve', 'lint', 'serve', 'test' /* , 'e2e', 'xi18n' */].reduce(
  (acc, name) => {
    acc[name] = architectCommand(name, logger);
    return acc;
  },
  {} as CommandMap
);

const commandMap: CommandMap = {
  help: () => {
    console.log(`everything looks fine, you do not need help`);
  },
  ...architectCommandMap,
  generate: schematicCommand(logger)
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

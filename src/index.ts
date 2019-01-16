const sngCommands = ['build'];

function runCommand(arguments: string[]) {
  if (arguments.length < 1) {
    throw new Error('Unable to find a command to run');
  }
  const commandName: string = arguments.shift()!;
  if (!sngCommands.includes(commandName)) {
    return 1;
  }
  console.log(`nothing to do with ${commandName} for now`);
  return 0;
}

if (process.argv.length < 1) {
  console.error('use a command');
  process.exit(1);
}

try {
  runCommand(process.argv.slice(2));
} catch(err) {
  if (err && err.message) {
    console.log(err.message);
  } else {
    throw err;
  }
}

const commandMap: { [key: string]: () => any } = {
  help: () => {
    console.log(`everything looks fine, you do not need help`);
  }
};

function runCommand(args: string[]) {
  const commandName: string = args.shift()!;
  if (!commandName || !(commandName in commandMap)) {
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

import path from 'path';
import execa from 'execa';
import fuzzy from 'fuzzy';
import globby from 'globby';
import pkgDir from 'pkg-dir';
import escExit from 'esc-exit';
import readPkg from 'read-pkg';
import inquirer from 'inquirer';
import template from 'es6-template-strings';

async function getConfig () {
  // TODO: Maybe cache it someday
  const root = await pkgDir(process.cwd());
  const { jikko = {} } = await readPkg(root);
  return jikko;
}

async function filterOptions (input, options) {
  return input ? fuzzy.filter(input, options).map(el => el.original) : options;
}

async function listOptions (options, message = 'Options:') {
  inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));
  return inquirer.prompt([{
    name: 'options',
    message,
    type: 'autocomplete',
    pageSize: 10,
    source: async (answers, input) => await filterOptions(input, options)
  }]);
}

async function listCommands (choices) {
  return inquirer.prompt([{
    name: 'command',
    message: 'Select a command:',
    type: 'list',
    pageSize: 10,
    choices
  }]);
}

async function runCommand (cmd, config) {
  if (config[cmd]) {
    const { pattern, message, command } = config[cmd];
    // TODO: provide option for filter fn
    const dirs = (await globby(pattern)).map(f => path.basename(f));

    const { options: answer } = await listOptions(dirs, message);
    const [prg, ...args] = template(command, { answer }).split(' ');
    execa(prg, args, { stdio: 'inherit' });
  }
  else {
    // TODO: Show error and give example
  }
}

async function shipIt () {
  try {
    escExit();

    const cmd = process.argv[2];
    const config = await getConfig();

    if (cmd) {
      runCommand(cmd, config);
    }
    else {
      const config = await getConfig();
      const availableCommands = Object.keys(config);
      // Just run it if there's only one command
      if (availableCommands.length === 1) {
        runCommand(availableCommands[0], config);
      }
      else if (availableCommands.length > 1) {
        const { command } = await listCommands(availableCommands);
        runCommand(command, config);
      }
      else {
        // TODO: Show error and give example
      }
    }
  } catch (e) {
    console.error(e);
  }
}

shipIt();

#! /usr/bin/env node

var denvar = require('../lib');

var help = 'denvar\n--create|-c json|npmrc [path]\n--export-heroku|exph [environment] [remote]\n--help|-h\n';

var userArgs = process.argv.slice(2);

if (!userArgs[0]) {
  console.log(help);
} else {
  switch (userArgs[0]) {
    case '--create':
    case '-c':
      var type = 'json';
      var path = './';
      if (userArgs[2]) {
        type = userArgs[1];
        path = userArgs[2];
      } else if (userArgs[1]) {
        type = userArgs[1];
      }
      denvar.createEnvFile({type: type, path: path});
      break;
    case '--export-heroku':
    case '-exph':
      var env = 'production';
      var remote = 'heroku';
      if (userArgs[2]) {
        env = userArgs[1];
        remote = userArgs[2];
      }
      denvar.exportToHeroku(env, remote);
      break;
    case '--help':
      console.log(help);
      break;
    default:
      console.log(help);
  }
}

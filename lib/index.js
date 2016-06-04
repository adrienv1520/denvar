var fs = require('fs');
var fsc = require('fs-check');
var path = require('path');
var execSync = require('child_process').execSync;

// Denvar object with default values
var Denvar = function() {
  // The key object in .env/env.json file that is loaded each time (common over different environments)
  this.COMMON_ENV_KEY = 'common';

  // The prefix in .npmrc file form common variables over environments
  this.NPM_COMMON_ENV_PREFIX = 'C';

  // The default path/names of env files
  this._ENV_FILES = {'json': 'env.json', 'npmrc': '.npmrc'};

  this.path = this._ENV_FILES.json;
};

/**
 * FUNCTION load
 * Load environment variables in process.env
 *
 * @param  {string}       env     The environment to load (eg. development).
 * (It allows flexibility to name the environment as wanted in env file)
 */
Denvar.prototype.load = function(env) {
  // TODO add support for options{encoding, path}

  this._checkEnvPath();

  var envVariables = this._readEnvFile(env);
  var commonEnv = envVariables[this.COMMON_ENV_KEY];
  var selectedEnv = envVariables[env];

  for (var envKey in commonEnv) {
    // console.log(this.COMMON_ENV_KEY + '.' + envKey + ' = ' + commonEnv[envKey]);
    // .env variables won't overset a preexisting environment variable
    process.env[envKey] = process.env[envKey] || commonEnv[envKey];
  }

  for (var envKey in selectedEnv) {
    // console.log(env + '.' + envKey + ' = ' + selectedEnv[envKey]);
    // .env variables won't overset a preexisting environment variable
    process.env[envKey] = process.env[envKey] || selectedEnv[envKey];
  }
};

/**
 * FUNCTION getNpmConfig
 * Get no-prefixed npm project variables in .npmrc root directory ONCE LOADED in Node app (no .npmrc file read)
 * Match every npm_config_{environment}_ prefix variables in process.env and return an Object with no prefix
 * .npmrc IS CASE INSENSITIVE but prefixes used by environment are CASE SENSITIVE so 'dev' prefix will not match with 'DEV'
 *
 * @param  {string}       envPrefix     Environment prefix needed eg. 'dev' for development in .npmrc like 'DEV_MONGO_USER'
 * @return {Object}       projectConfig
 */
Denvar.prototype.getNpmConfig = function(envPrefix) {
  var projectConfig = {};

  var npmCommonVars = 'npm_config_' + this.NPM_COMMON_ENV_PREFIX + '_';
  var npmCommonVarsLength = npmCommonVars.length;
  var npmEnvPrefixVars = 'npm_config_' + envPrefix + '_';
  var npmEnvPrefixVarsLength = npmEnvPrefixVars.length;

  for (var key in process.env) {
    if (key.substr(0, npmCommonVarsLength) === npmCommonVars) {
      // eg. npm_config_C_S3_USER key will be added in projectConfig with S3_USER key
      projectConfig[key.slice(npmCommonVarsLength)] = process.env[key];
    } else if (key.substr(0, npmEnvPrefixVarsLength) === npmEnvPrefixVars) {
      // eg. npm_config_DEV_MONGO_USER key will be added in projectConfig with MONGO_USER key
      projectConfig[key.slice(npmEnvPrefixVarsLength)] = process.env[key];
    }
  }
  return projectConfig;
};

/**
 * FUNCTION exportToHeroku
 * Export an environment to Heroku environment variables
 * Mostly useful to export production variables in command line tool by a npm script after a deploy
 * CLI : denvar --export-heroku|exph [production] [heroku]
 *
 * @param  {string}       env       The environment to export (eg. production)
 * @param  {string}       remote    The remote used to deploy (eg. heroku by default or stage, production, ...)
 */
Denvar.prototype.exportToHeroku = function(env, remote) {
  remote = remote || 'heroku';
  env = env || 'production';

  var envVariables = this._readEnvFile(env);
  var commonEnv = envVariables[this.COMMON_ENV_KEY];
  var exportedEnv = envVariables[env];

  for (var envKey in commonEnv) {
    // console.log('heroku config:set ' + envKey + '=' + commonEnv[envKey] + ' --remote ' + remote);
    execSync('heroku config:set ' + envKey + '=' + commonEnv[envKey] + ' --remote ' + remote);
  }

  for (var envKey in exportedEnv) {
    // console.log('heroku config:set ' + envKey + '=' + exportedEnv[envKey] + ' --remote ' + remote);
    execSync('heroku config:set ' + envKey + '=' + exportedEnv[envKey] + ' --remote ' + remote);
  }
};

/**
 * INTERNAL FUNCTION _checkEnvPath
 * Check if a .env/env.json file is in root directory, create a sample env.json file if not
 *
 * @param  {}
 * @return {}
 */
Denvar.prototype._checkEnvPath = function() {
  // TODO these variables could be received from an options{} object from load function
  var envPath = ".env";
  var envJSONPath = "env.json";

  // Check if a .env or env.json file exists in root directory app, if not will copy the env.json file sample from lib/ to app root/
  if (!fsc.existsSync(envPath) && !fsc.existsSync(envJSONPath)) {
    try {
      fs.linkSync(path.join(__dirname, envJSONPath), envJSONPath);
    } catch (e) {
      console.error(e);
      return false;
    }
  } else if (fsc.existsSync(envPath) && !fsc.existsSync(envJSONPath)) {
    this.path = envPath;
  }
};

/**
 * INTERNAL FUNCTION _readEnvFile
 * Read environment file and return an Object with environment variables matching with env key and common key
 *
 * @param  {string}     env     The environment to load in Object (eg. development)
 * @return {Object}     envVariables
 */
Denvar.prototype._readEnvFile = function(env) {
  var encoding = "utf8"; // var encoding = options.encoding || "utf8";
  env = env || 'development';

  var envVariables = {};

  // Read .env or env.json file and parse in JSON format
  try {
    var fileObject = JSON.parse(fs.readFileSync(this.path, {encoding: encoding}));

    if (fileObject.hasOwnProperty(this.COMMON_ENV_KEY)) {
      envVariables[this.COMMON_ENV_KEY] = fileObject[this.COMMON_ENV_KEY];
    }

    if (fileObject.hasOwnProperty(env)) {
      envVariables[env] = fileObject[env];
    } else {
      throw new Error('No "' + env + '" object in ' + this.path + ' file. Read documentation to know how configure your environment variables.');
      return false;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
  return envVariables;
};

/**
 * FUNCTION createEnvFile
 * Create an environment sample file (env.json or .npmrc) to a specified path or at root directory
 *
 * @param  {Object}     options {type, path}     type (json by default, npmrc) and path (project directory by default or specific path)
 */
Denvar.prototype.createEnvFile = function(options) {
  var envFile = this._ENV_FILES[options.type] || this._ENV_FILES.json;
  var pathDirectory = fsc.isDirSync(options.path) ? options.path : './';
  var pathToEnvFile = path.join(pathDirectory, envFile);

  // Check if a .env or env.json file already exists in pathToEnvFile to not override it
  if (!fsc.isFileSync(pathToEnvFile)) {
    try {
      fs.linkSync(path.join(__dirname, envFile), pathToEnvFile);
      console.info('"' + pathToEnvFile + '" was successfully created.');
    } catch (e) {
      console.error(e);
    }
  } else {
    console.error(new Error('File "' + pathToEnvFile + '" already exists.'));
  }
};

module.exports = new Denvar();

# Denvar

<img src="logo.png" alt="Denvar" align="right" />

A Node module and command line tool to load environments variables - as database user and passwords for example - in development, test production environment locally and finally export them for production.

Denvar make the distinction between your development variables, your production ones and some of them that are common over each environment.

## A full project example

You will find a [full stack project booster](https://github.com/AdVg/express-hero) on Express that uses *Denvar* and [Front Flower](https://github.com/AdVg/front-flower), another module that i've made to kick off the workflow with npm as build tool for assets, checking security in Node apps, running test to finally deploy an app on Heroku and export variables (stage or production), all automatically.

## Installation

`npm install denvar --save`

## How does it work ?

Denvar can be :

  - used in your Node application to **load environment variables** in process.env from a .env or env.json file located at your project root directory. If no environment configuration file is found, a sample file will be created. At the moment, only JSON format is supported.

  - used to **get npm config variables** from your .npmrc file (see below for more details) !

  - run in command line commonly to **export production variables** after a deploy by a npm script. At the moment, only *Heroku* is supported.

## How to use it

### Load your environment variables

There are two ways to load an environment. See *Discussion* section for more information.

  1. **From a .env or env.json file**
    - located at the root of your project directory
    - in JSON format (at the moment only supported)
    - if no file found, a sample env.json file will be created

    Here is an env.json example file :
    ```javascript
    {
      "common": {
        "MONGO_USER": "superman"
      },
      "development":
      {
        "NODE_ENV": "development",
        "DEBUG": "your-project-name:*",
        "MONGO_PASS": ""
      },
      "production":
      {
        "NODE_ENV": "production",
        "MONGO_PASS": "cryptonite",
        "NODE_MODULES_CACHE": false
      }
    }
    ```

    Require the module as soon as possible and load the key environment that is used in your env.json file. Denvar is flexible so you can use the key name of your choice as 'dev' or even 'd' if you prefer. For an example, at the first line in your app.js in Express :
    ```javascript
    require('denvar').load('development'); // 'development' is the key in env.json file

    // Both common and here 'development' environments can now be accessed as process.env keys
    debug(process.env.MONGO_USER); // Show 'superman'

    // Require everything you need
    var express = require('express');
    // ...

    // Then create your express app
    var app = express();
    ```

  2. **From your .npmrc file (npm configuration file)**

    Yes ! Node automatically load the KEY=VALUE-format variables in your .npmrc file at the root project directory of your app.
    You can directly access them from `process.env.npm_config_YOUR_VARIABLE` without the help of any module ! .npmrc is also loaded in *Heroku*. There is no matter of any conflict in process.env because your environment variables are not reloaded in it but are set in an projectConfig object.

    *So what Denvar is doing ?*
    Denvar is simply adding some rules to make the difference between environments and gives you an object with less annoying and very long key names. See example below.

    *And what Denvar is not doing yet ?*
    No export supported, this file should be read for that purpose and so a parser should be written.

    The .npmrc file :
    ```
    access=restricted

    ; This is a comment line

    ; INSTALL PREFIX FOR DEPENDENCIES (more stable and safer for production use than ^!)
    save-prefix=~

    ; COMMON ENVIRONMENT (prefix must not be changed)
    C_S3_USER=superhero
    C_S3_PASS=avengers and xmen together

    ; DEVELOPMENT ENVIRONMENT
    DEV_NODE_ENV=development
    DEV_MONGO_USER=superman
    DEV_MONGO_PASS=cryptonite is not good

    ; PRODUCTION ENVIRONMENT
    PROD_NODE_ENV=production
    PROD_MONGO_USER=thor
    PROD_MONGO_PASS=beware my hammer
    ```

    As you can see, a prefix is added before each variable so we can make the difference between environments. Note that each variable will be automatically loaded by Node in process.env with npm_config_YOUR_VARIABLE key. You can use Denvar to get an object matching a specific environment and common variables.

    Now in your Node application, require module and get npm config variables as soon as possible.
    **Please note** that these variables are automatically loaded by Node ONCE your application is running. Moreover, some variables like NODE_ENV and DEBUG should be set at the very first moment to be effectively used by the Node application.
    ```javascript
    var projectConfig = require('denvar').getNpmConfig('DEV'); // 'DEV' is the development prefix in .npmrc file

    // In Express, when var app = express(); is executed, it is too late to set NODE_ENV and DEBUG
    // So you should not set these variables with app.set method but before setting app object like this :
    process.env.NODE_ENV = projectConfig.NODE_ENV;
    process.env.DEBUG = projectConfig.DEBUG;

    // Require everything you need
    var express = require('express');
    // ...

    // Then create your express app and use your variables
    var app = express();

    debug('This is my S3 username that i\'m going to use soon : ' + projectConfig.S3_USER);
    ```
  3. Access *.npmrc* variables in *package.json* ...?!

    Yes, in fact there is a third awesome way to access your environment variables ! Here is a simple *.npmrc* file :
    ```
    access=restricted

    ; Project
    PROJECT_NAME=hello from denvar !
    DESCRIPTION=The last Dinosaur !

    ; S3 credentials
    S3_USER=superman
    S3_PASS=cryptonite

    ; Some util paths
    ASSETS_SASS=assets/sass/app.scss
    DIST_CSS=dist/css/app.css
    ```

    You can access them in *package.json* with *$npm_config_YOUR_VARIABLE* variable name like this :

    ```javascript
    {
      "name": "denvar",
      "version": "0.1.0",
      "description": "$npm_config_DESCRIPTION",
      "author": "Adrien Valcke <a.valcke@free.fr>",
      "scripts": {
        "sass": "node-sass --output-style compressed $npm_config_ASSETS_SASS $npm_config_DIST_CSS",
        "autoprefixer": "postcss -u autoprefixer -b 'last 2 versions' -r $npm_config_DIST_CSS",
        "hello": "echo $npm_config_PROJECT_NAME"
      },
      "dependencies": {},
      "devDependencies": {
        "autoprefixer": "~6.3.6",
        "node-sass": "~3.7.0"
      }
    }
    ```

    Running `$ npm run hello` will show in console *hello from denvar !* .

    After all, the *.npmrc* file is the project configuration file.

    Now imagine :
      - you could define some variables to not repeat them in *package.json* like path to *js*, *css*, *markup* (assets/dist), deploy on *Amazon S3* with your credentials, automatically login in Heroku, or automatically do everything by npm scripts,
      - if a tool is not available in CLI, write your own js file and make a npm script that runs 'node my-script.js',
      - you still can access them in your *process.env* Object in Node app,
      - and of course, your *.npmrc* must be added to *.gitignore* so it stays confidential.

    See [npm Flower](https://github.com/AdVg/npm-flower) project example using only npm as build and environment tool.

### Use it as a command line tool
  - **Create** a .npmrc or env.json sample file at your project root directory or at a specific path (by default a *env.json* file is created at your project root directory) :

  `denvar --create|-c json|npmrc [path]`

  Examples :
  ```
  $ denvar -c                 (creates env.json at project root directory)
  $ denvar --create npmrc     (creates .npmrc at project root directory)
  $ denvar -c npmrc ~/www/
  ```

  - **Export** specified variables to a *Heroku* remote (by default 'production' variables to 'heroku' remote) :

  `denvar --export-heroku|exph [environment] [remote]`

  In order to export variables to *Heroku*, you must have a [GitHub](https://github.com/) and [Heroku](https://www.heroku.com/) account plus [Git](https://git-scm.com/) and [heroku-toolbelt](https://toolbelt.heroku.com/) installed. See the [full stack project example](https://github.com/AdVg/express-hero) for more details.

  Examples :
  ```
  $ denvar --export-heroku
  $ denvar -exph test stage
  ```

  - Amazon AWS (ElasticBeanstalk, CloudFront, S3, ...) and others :

  `$oon`

  - Help

  `denvar --help|-h`

### CONFIDENTIAL
Because you certainly don't want to share your project configuration (username, passwords, ...), **add .env, env.json or .npmrc files to your** *.gitignore* **file** :

```
node_modules/*
npm-debug.log
/*.DS_Store
env.json
```

## Discussion
By reading a lot of documentation and tutorials, I found two really good ways to load/access environment variables and I don't really know what is the very best practice to adopt. Load from an env file in process.env or directly get them from .npmrc file ? Or something else ?

Another possible way would be to load an env file in the package.json config{} object so we can access our variables with process.env.npm_package_config_YOUR_VARIABLE and reset the object once the application is loaded. And no confidential data pushed to git.

But I found the variables name too long and annoying. And so why not add your variables in the npm configuration file (.npmrc) that is loaded in the app automatically ? You can access your variables by npm_config_YOUR_VARIABLE or by the object Denvar returns from getNpmConfig() method with no annoying prefixes and depending on your environment. The main problem is that Express uses environment variables in process.env to set up so we must set as soon as possible some variables like NODE_ENV and DEBUG.

What *Heroku* says about best practices :
>Don’t litter your project with environment-specific config files! Instead, take advantage of *environment variables*.

Please notice that the first method I use will never overset an existed variables in process.env but finally it can be a problem if there are many of our environment variables that we should rename for your application to run ! Okay we can use an alias ?

## Contributing

Any advices or help will be greatly welcome. Feel free to contribute or discuss about these methods so we can improve our best practices and make our work far better.

Here's some features that will be nice to add :

  - Test application (very important)
  - Add support for Amazon and other platforms in CLI export.
  - Add a parser to load .env file in KEY=VALUE format but still with the distinction between different environments so we still can export production variables
  - Add support for options {encoding, envPath} for Denvar.prototype.load method so we could load a configuration file not located at the project root directory.

## Notes

This project was initially made to help me building Node/Express apps with easier environment variables consideration. This structure may not match your attempts or project needs.

This work is a result of joining different sources on the internet. Here are they :

- [Node Best Practices](https://devcenter.heroku.com/articles/node-best-practices#be-environmentally-aware)
- [Configuration and Config Vars](https://devcenter.heroku.com/articles/config-vars)
- [Heroku Local](https://devcenter.heroku.com/articles/heroku-local)
- [Managing environment variables in Node.js](https://medium.com/@rafaelvidaurre/managing-environment-variables-in-node-js-2cb45a55195f#.v0lafnhld)
- [Using npm config](https://kirou.wordpress.com/2015/11/09/using-npm-config/)
- [NPM Scripts Example](https://github.com/keithamus/npm-scripts-example)

My english seems confusing ? Feel free to correct my 'frenchy' sentences !

## Licence

The MIT License (MIT) Copyright © 2016 Adrien Valcke

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the “Software”), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

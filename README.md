# EduSys

An API service endpoint written for educators to manage students.

## About

This API service is part of a technical exercise. 
It assumes that login and access control has been established.

This project focuses on the following:
- Code readability and cleanliness
- Secure coding practices
- Code structure, abstraction. modularity and design
- Testability
- Extensibility
- Documentation

## Live Instance

You can access a live instance of this service at this [base url](https://ufinity-edusys.appspot.com). 
Simply append the endpoint route to this base URL to consume it. 

Please note that this project is not affiliated or produced by Ufinity. 
The non-mutable application identifier (which could have been better 
named to prevent trademark infringement) was used by Google Cloud to 
generate the service link.

## API Documentation

This set of API endpoints is documented in a `Postman` collection at `/edusys.postman_collection.json`. You can use it with Postman, view it [on a web browser](https://documenter.getpostman.com/view/4627841/S1LvUo9A), or alternatively, use the Swagger UI documentation to browse API definitions and examples. 

You can access the documentation here: [Swagger API Documentation](https://hliejun.github.io/edusys/index.html)

## Development

To contribute to this project, please refer to the following sections to ready your development environment.

### Prerequisites

Before we begin, please ensure that you have [Git](https://git-scm.com/downloads) and [NodeJS](https://nodejs.org/en/download) installed. You can manually install them using packages from their download page. Alternatively, you can also use your favourite OS package manager to install them. This project requires NodeJS version `>=8.10.0`, so please ensure you have met the minimum dependency.

The `/.gitignore` file is included to leave out specific items from your commits.

This project also utilises [ESLint](https://eslint.org/docs/user-guide/getting-started) and [Prettier](https://prettier.io/docs/en/install.html) to enforce coding style and standards. You can optionally install these linters/formatters globally or locally and set up for use with your favourite editor using their respective editor plugins.

Linter configuration files are included to define linting rules:

- `/.eslintrc.json` is used for `.js` files. This service is written in ES6.
- `/.prettierrc.json` is used for general code formatting and is especially handy when used with hackable code editors such as [Visual Studio Code](https://code.visualstudio.com) or [Atom](https://atom.io).

### Setup

1. First, we begin by cloning this repository using Git.

   Open Terminal and navigate to your preferred directory:

   ```bash
   # e.g. cd ~/developer/projects
   cd [your preferred directory]
   ```

   Clone this repository to your current directory:

   ```bash
   # e.g. git clone https://github.com/hliejun/edusys.git
   git clone [repository url]
   ```

   If you are still unsure of how to find your repository url, you can follow [Step 2 of the fork-a-repo guide](https://help.github.com/en/articles/fork-a-repo).

2. Next, we install all the required dependencies using a NodeJS package manager.

   Enter the local directory of the cloned repository:

   ```bash
   # e.g. cd edusys
   cd [project name]
   ```

   Install NodeJS dependencies using [npm](https://www.npmjs.com/get-npm) or [Yarn](https://yarnpkg.com/en/docs/install):

   ```bash
   # If you are using npm:
   npm i

   # If you are using Yarn:
   yarn
   ```

3. Link your editor workspace to utilise the linter and formatter files provided in the cloned repository.

   To make use of the linter files, you need to find and install the right plugins for your editor:

   ESLint - [VSCode](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) | [Atom](https://atom.io/packages/linter-eslint) | [Sublime Text](https://github.com/SublimeLinter/SublimeLinter-eslint)

   Prettier - [VSCode](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) | [Atom](https://atom.io/packages/prettier-atom) | [Sublime Text](https://github.com/jonlabelle/SublimeJsPrettier)

### Quick Start

This project utilises npm scripts defined in `package.json`.

To start this application locally in development mode, you can run:

```bash
# If you are using npm:
npm run start:dev

# If you are using Yarn:
yarn start:dev
```

This is equivalent to migrating and seeding the `MySQL` database, 
followed by running `babel-node` to transpile the ES6 module 
at the entrypoint `app/server.js` and executing it with the `nodemon` 
module locally with a `NODE_ENV=development` environment:

```bash
# Refer to package.json under 'scripts' for more details
NODE_ENV=development ./node_modules/.bin/knex migrate:latest
NODE_ENV=development ./node_modules/.bin/knex seed:run
NODE_ENV=development ./node_modules/.bin/nodemon --exec babel-node app/server.js
```

Now with the application running, you can make service calls to the root domain `localhost:8080`. 
Note that any changes made to the code will trigger a reload by `nodemon` to 
ensure that your server is up-to-date with those changes.

#### Database Engine and Client

This project uses `MySQL` for its database, and `KnexJS` as a query builder and data access engine.

1. To set up MySQL on your machine:
    ```
    brew install mysql
    ```

2. Start the service:
    ```
    brew services start mysql
    ```

3. Set local credentials:
    ```
    mysqladmin -u root password 'password'
    ```

To link this project with your local SQL database, you can choose to use a database client, such as `SequelPro`.
You can install it here: https://sequelpro.com/download. On MacOS Mojave, `SequelPro` sometimes crashes unexpectedly. 
In that case, please consider installing nightly builds instead: https://sequelpro.com/test-builds. To do so on CLI on MacOS:

1. Uninstall Sequel Pro (or delete it directly if installed manually):
    ```
    brew cask uninstall sequel-pro
    ```

2. Install sequel-pro-nightly:
    ```
    brew cask install homebrew/cask-versions/sequel-pro-nightly
    ```

3. Enter configuration settings in connection tab GUI. 
   Note that for `localhost`, set host to `127.0.0.1`. Enter your local credentials for MySQL as well.

4. Once you have logged in and connected, you can add a database by selecting `Database` `>` `Add Database` in the application window menu. Name your database and select the database encoding `Default (utf8)` and collation `Default (utf8_general_ci)`.

#### Environment Variables

This project also uses `dotenv` to isolate enivronment-specific variables across `.env` files. 
For development, you can specify variables in `/.env.development` and thereafter you can access 
them in your source files using `process.env.[YOUR_KEY]`. To find out what you can put in `.env` files,
you can look at `.env.example`. For example, you can use these files to specify your DB credentials.

### Structure

The project is split into different aspects, namely:

- `/app/routes` describes the API contracts exposed to users
- `/app/actions` encapsulates the business logic behind the API services
- `/app/store` yields the data access logic and configuration, abstracted by data access objects
- `/app/utils` consists of errors, parsers, validators, etc. that are commonly accessed and shared throughout the service
- `/app/constants` maintains a single source of truth for fixed strings, configuration parameters, etc.
- `/app/server.js` is the entrypoint for the `express` application and manages the setup and bootstrapping of the project with middlewares and plugins

### Testing

The project uses a combination of `Mocha` + `Chai` + `Sinon` to perform unit and integrated testing.

To run tests, use the CLI command as configured in `package.json`:
```
npm run test:dev
```
This is equivalent to invoking this command:
```
find ./app -name '*.spec.js' | NODE_ENV=development xargs ./node_modules/.bin/mocha --require @babel/register --require babel-polyfill -R spec --exit
```
The above identifies all test files in the entire project, named under the convention of `*.spec.js`, and transpile them using `Babel` before running it by `Mocha`. It also uses the `--exit` flag to force exit on completion, and `-R spec` specifies to use the `spec` reporter to output the test outcomes.

Running tests will invoke migrations and rollbacks on the database and may cause changes to the database. Please do not use the same database that you use to persist any form of data to test with. In the situation that you share the same test database as with the local API instance, you should remember to invoke:
 ```
  npm run migrate:dev
 ``` 
after testing and before you start the server. This is automatically done for you when you invoke `npm run start:dev`. 
This is to ensure that your database is up-to-date and created with the correct tables to handle data with.

In the situation that you need to perform a rollback, you can do:
```
npm run rollback:dev
```
Please check the `package.json` scripts section for more commands and details of how these commands are executed.

## Built With

### Dependencies
- `bcrypt`: encryption and comparison of persisted sensitive data such as passwords
- `body-parser`: parse request parameters into accessible objects
- `cors`: enable cross-origin resource sharing requests for all origins
- `dotenv`: modular and environment-specific variable sets
- `express`: web framework and middlewares support
- `express-validator`: validate request input parameters
- `knex`: SQL query builder to abstract query complexities
- `mysql`: relational database engine

### Dev Dependencies
- `babel`: transpiling from ES6
- `chai`: assertion library for testing
- `eslint`: code standard and linting
- `mocha`: test framework
- `nodemon`: "hot reloading" for NodeJS server application
- `prettier`: code standard and formatting
- `sinon`: function stubs and spies for tests

## Authors

- **Huang Lie Jun** - _Initial development_ - [hliejun](https://hliejun.github.io)

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/) - see the [LICENSE.md](LICENSE.md) file for details

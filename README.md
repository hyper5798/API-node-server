# Express + async/await + node-red + sequelize-cli

API & MQTT subscript notify

## Installation

To install and test the code please follow the following steps:

* Clone or fork the repository
* Go to the local repository folder and digit 
```bash
npm install
```
* Once all requested modules have been installed digit
```bash
npm start
```
The express application start at: http://localhost:5000/

## References:
* sequelize Migrations
1. Installing the CLI
npm install --save-dev sequelize-cli
npm install --save-dev sequelize 
npm install --save-dev mysql2 

2. setting  .sequelizerc

// .sequelizerc

const path = require('path');
 
module.exports = {
  'config': path.resolve('config', 'database.json'),
  'models-path': path.resolve('db', 'models'),
  'seeders-path': path.resolve('db', 'seeders'),
  'migrations-path': path.resolve('db', 'migrations')
};

3. To create an empty project you will need to execute init command
   npx sequelize-cli init

4. Configuration database.json (for connect database)

5. Creating Model
   npx sequelize-cli model:generate --name User --attributes firstName:string,lastName:string,email:string

6. Running Migrations
   npx sequelize-cli db:migrate
   --undo
   npx sequelize-cli db:migrate:undo

7. Creating Seed
   npx sequelize-cli seed:generate --name demo-user

8. Running Seeds
   npx sequelize-cli db:seed:all
   --undo
   npx sequelize-cli db:seed:undo

* Node-red - Embedding into an existing app
 
// Create an Express app
var app = express();

// Add a simple route for static content served from 'public'
app.use("/",express.static("public"));

// Create a server
var server = http.createServer(app);

// Create the settings object - see default settings.js file for other options
var settings = {
    httpAdminRoot:"/red",
    httpNodeRoot: "/api",
    userDir:"/home/nol/.nodered/",
    functionGlobalContext: { }    // enables global context
};

// Initialise the runtime with a server and settings
RED.init(server,settings);

// Serve the editor UI from /red
app.use(settings.httpAdminRoot,RED.httpAdmin);

// Serve the http nodes UI from /api
app.use(settings.httpNodeRoot,RED.httpNode);

server.listen(8000);

// Start the runtime
RED.start();



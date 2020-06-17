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

* Docker 
  1. 創建 docker build . -t docker-api
  2. 安裝並執行 docker run -p 3010:3010 -d docker-api
  3. 查詢 container id
     $ docker ps
  4. 進入容器中，請運行exec命令
     $ docker exec -it <container id> /bin/bash
  5. 更改 config/database.json
     $ vi ../config/database.json

     


const mysql = require('mysql2'); //libreria de MySQL
const config = require('../env/mysqlConfig'); 

class SqlConnection{
    constructor(){
        this.connection = mysql.createConnection(config);
        this.isConnected = false;
    }
    
    connectToDb(){
        return new Promise((resolve, reject) => {
            this.connection.connect((err) => {
                if (err) {
                    return reject(err);
                }
                console.log('Conexión exitosa a MySQL');
                this.isConnected = true;
                resolve();
            });
        });
    }
    
    query(sql, args) {
        return new Promise((resolve, reject) => {
          this.connection.query(sql, args, (err, results) => {
            if (err) {
              return reject(err);
            }
            resolve(results);
          });
        });
    }
    
    closeConnection() {
        return new Promise((resolve, reject) => {
          this.connection.end((err) => {
            if (err) {
              return reject(err);
            }
            this.isConnected = false
            resolve();
          });
        });
      }
    
}

// Modo demo: se usa la base MySQL en memoria (misma interfaz)
const isDemo = require('./demoMode');
module.exports = isDemo ? require('./demo/memorySql').MemorySqlConnection : SqlConnection;
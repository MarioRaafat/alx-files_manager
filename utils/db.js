const dotenv = require('dotenv');
const mongodb = require('mongodb');



class DBClient {
    constructor() {
        dotenv.config();
        this.host = process.env.DB_HOST || 'localhost';
        this.port = process.env.DB_PORT || 27017;
        this.database = process.env.DB_DATABASE || 'files_manager';
        this.url = `mongodb://${this.host}:${this.port}`;
        this.client = new mongodb.MongoClient(this.url, { useUnifiedTopology: true });
        this.client.connect();
    }

    isAlive() {
        return this.client.isConnected();
    }

    async nbUsers() {
        return this.client.db(this.database).collection('users').countDocuments();
    }

    async nbFiles() {
        return this.client.db(this.database).collection('files').countDocuments();
    }
}

const dbClient = new DBClient();
module.exports = dbClient;
import createClient from 'redis';
import { promisify } from 'util';

class RedisClient {
    constructor() {
        this.client = createClient.createClient();
        this.connected = true;

        this.client.on('error', (error) => {
            console.log(`Redis client not connected to the server: ${error.message}`);
            this.connected = false;
        });
        this.client.on('connect', () => {
            this.connected = true;
        });

        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setAsync = promisify(this.client.set).bind(this.client);
        this.delAsync = promisify(this.client.del).bind(this.client);
    }

    isAlive() {
        return this.connected;
    }

    async get(key) {
        return this.getAsync(key);
    }

    async set(key, value, duration) {
        await this.setAsync(key, value);
        this.client.expire(key, duration);
    }

    async del(key) {
        await this.delAsync(key);
    }
}

const redisClient = new RedisClient();
export default redisClient;

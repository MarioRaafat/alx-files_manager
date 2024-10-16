import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

export const getStats = (req, res) => {
    res.status(200).json({
        users: dbClient.nbUsers(),
        files: dbClient.nbFiles(),
    });
}

export const getStatus = (req, res) => {
    res.status(200).json({
        redis: redisClient.isAlive(),
        db: dbClient.isAlive(),
    })
}

import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';

export const getStats = (req, res) => {
    Promise.all([dbClient.nbUsers(), dbClient.nbFiles()])
        .then(([usersCount, filesCount]) => {
            res.status(200).json({ users: usersCount, files: filesCount });
        });
}

export const getStatus = (req, res) => {
    res.status(200).json({
        redis: redisClient.isAlive(),
        db: dbClient.isAlive(),
    })
}

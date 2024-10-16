import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis.js';

export const getConnect = async (req, res) => {
    const user = req.user;
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400); // 24 hours
    res.status(200).json({ token });
}

export const getDisconnect = async (req, res) => {
    const xToken = req.headers['x-token'];
    await redisClient.del(`auth_${xToken}`);
    res.status(204).end();
}
import dbClient from '../utils/db.js';
import redisClient from '../utils/redis.js';
import sha1 from 'sha1';

export const Authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const authorizationParts = authHeader.split(' ');
    if (authorizationParts.length !== 2 || authorizationParts[0] !== 'Basic') {
        return res.status(401).json({ error: 'Unauthorized' });;
    }
    
    const token = Buffer.from(authorizationParts[1], 'base64').toString();
    const [email, password] = token.split(':');
    const user = await dbClient.client.db().collection('users').findOne({ email, password: sha1(password) });
    
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    next();
}

export const xTokenAuthenticate = async (req, res, next) => {
    const xToken = req.headers['x-token'];
    if (!xToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = redisClient.get(`auth_${xToken}`);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.client.db().collection('users').findOne({ _id: dbClient.ObjectID(userId) });
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    next();
}
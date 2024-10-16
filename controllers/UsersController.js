import dbClient from '../utils/db.js';
import sha1 from 'sha1';

export const postNew = async (req, res) => {
    const {email , password} = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });

    const user = await dbClient.client.db().collection('users').findOne({email});
    if (user) return res.status(400).json({ error: 'Already exist' });

    const result = await dbClient.client.db().collection('users').insertOne({email, password: sha1(password)});
    const userId = result.insertedId.toString();
    res.status(201).json({email, id: userId});
}

export const getMe = (req, res) => {
    const { user } = req;
    res.status(200).json({ email: user.email, id: user._id.toString() });
}
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db.js';
import envLoader from '../utils/env_loader.js';

envLoader();

const ROOT_FOLDER_ID = 0;
const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';


export const postUpload = async (req, res) => {
    const { name, type, isPublic = false, parentId = 0, data } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) return res.status(400).json({ error: 'Missing data' });

    const user = req.user;
    const userId = user._id;
    let insertedFile;

    let resolvedParentId = parentId; // Use a separate variable
    if (resolvedParentId !== ROOT_FOLDER_ID) {
        resolvedParentId = await dbClient.toObjectId(resolvedParentId);
        const parentFile = await dbClient.client.db().collection('files').findOne({ _id: resolvedParentId });
        if (!parentFile) return res.status(400).json({ error: 'Parent not found' });
        if (parentFile.type !== 'folder') return res.status(400).json({ error: 'Parent is not a folder' });
    }

    const newFile = {
        userId: userId,
        name,
        type,
        isPublic,
        parentId: resolvedParentId,
    };

    if (type === 'folder') {
        insertedFile = await dbClient.client.db().collection('files').insertOne(newFile);
    } else {
        // For file or image, decode the data and store it in the filesystem
        if (!fs.existsSync(FOLDER_PATH)) fs.mkdirSync(FOLDER_PATH, { recursive: true });

        const localPath = path.join(FOLDER_PATH, uuidv4());
        const fileData = Buffer.from(data, 'base64');
        fs.writeFileSync(localPath, fileData);

        newFile.localPath = localPath;

        insertedFile = await dbClient.client.db().collection('files').insertOne(newFile);
    }

    return res.status(201).json({
        id: insertedFile.insertedId.toString(),
        userId,
        name,
        type,
        isPublic,
        parentId: (parentId === ROOT_FOLDER_ID) || (parentId === ROOT_FOLDER_ID.toString())
            ? 0
            : parentId,
    });
};

export const getShow = async (req, res) => {};

export const getIndex = async (req, res) => {};

export const putPublish = async (req, res) => {};

export const putUnpublish = async (req, res) => {};

export const getFile = async (req, res) => {};
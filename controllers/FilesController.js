import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db.js';
import envLoader from '../utils/env_loader.js';
import mime from 'mime-types';

envLoader();

const ROOT_FOLDER_ID = 0;
const MAX_FILES_PER_PAGE = 20;
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

export const getShow = async (req, res) => {
    const { user } = req;
    const fileId = await dbClient.toObjectId(req.params.id);
    const userId = user._id;

    const file = await dbClient.client.db().collection('files').findOne({ _id: fileId, userId });
    if (!file) return res.status(404).json({ error: 'Not found' });

    return res.status(200).json({
        id: file._id.toString(),
        userId: userId.toString(),
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
        parentId: (file.parentId === ROOT_FOLDER_ID) ? 0 : file.parentId,
    });
};

export const getIndex = async (req, res) => {
    const { user } = req;
    const parentId = req.query.parentId || ROOT_FOLDER_ID;
    const page = /\d+/.test(req.query.page || '')
        ? Number.parseInt(req.query.page, 10)
        : 0;

    const filesFilter = {
        userId: user._id,
        parentId: parentId === ROOT_FOLDER_ID ? ROOT_FOLDER_ID : await dbClient.toObjectId(parentId),
    };

    try {
        const files = await dbClient.client
            .db()
            .collection('files')
            .aggregate([
                { $match: filesFilter },
                { $sort: { _id: -1 } }, // Sort by newest first
                { $skip: page * MAX_FILES_PER_PAGE },
                { $limit: MAX_FILES_PER_PAGE },
                {
                    $project: {
                        _id: 0,
                        id: '$_id',
                        userId: '$userId',
                        name: '$name',
                        type: '$type',
                        isPublic: '$isPublic',
                        parentId: {
                            $cond: { if: { $eq: ['$parentId', ROOT_FOLDER_ID] }, then: 0, else: '$parentId' },
                        },
                    },
                },
            ])
            .toArray();

        return res.status(200).json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const putPublish = async (req, res) => {
    const { user } = req;
    const fileId = await dbClient.toObjectId(req.params.id);
    const userId = user._id;

    const file = await dbClient.client.db().collection('files').findOne({ _id: fileId, userId });
    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.client.db().collection('files').updateOne({ _id: fileId }, { $set: { isPublic: true } });

    return res.status(200).json({
        id: file._id.toString(),
        userId: userId.toString(),
        name: file.name,
        type: file.type,
        isPublic: true,
        parentId: (file.parentId === ROOT_FOLDER_ID) ? 0 : file.parentId,
    });
};

export const putUnpublish = async (req, res) => {
    const { user } = req;
    const fileId = await dbClient.toObjectId(req.params.id);
    const userId = user._id;

    const file = await dbClient.client.db().collection('files').findOne({ _id: fileId, userId });
    if (!file) return res.status(404).json({ error: 'Not found' });

    await dbClient.client.db().collection('files').updateOne({ _id: fileId }, { $set: { isPublic: false } });

    return res.status(200).json({
        id: file._id.toString(),
        userId: userId.toString(),
        name: file.name,
        type: file.type,
        isPublic: false,
        parentId: (file.parentId === ROOT_FOLDER_ID) ? 0 : file.parentId,
    });
};

export const getFile = async (req, res) => {
    const fileId = await dbClient.toObjectId(req.params.id);
    const user = req.user;

    const file = await dbClient.client.db().collection('files').findOne({ _id: fileId });
    if (!file) return res.status(404).json({ error: 'Not found' });

    const isOwner = user && file.userId.toString() === user._id.toString();
    if (!file.isPublic && !isOwner) {
        return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
        return res.status(400).json({ error: "A folder doesn't have content" });
    }

    if (!file.localPath || !fs.existsSync(file.localPath)) {
        return res.status(404).json({ error: 'Not found' });
    }

    // from ChatGPT 
    // Determine the MIME type using the mime-types module
    const mimeType = mime.lookup(file.name) || 'application/octet-stream';

    // Return the file content with the correct MIME type
    res.setHeader('Content-Type', mimeType);
    const fileStream = fs.createReadStream(file.localPath);
    fileStream.pipe(res);
};
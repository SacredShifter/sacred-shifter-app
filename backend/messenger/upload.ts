import * as express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: 'uploads/messenger/',
    filename: (req, file, callback) => {
        const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
        callback(null, `${file.fieldname}-${uniqueSuffix}`);
    }
});

const upload = multer({ storage });
const uploadRouter = express.Router();

// Define the upload endpoint
uploadRouter.post('/message/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Save file details to database (pseudo-code, replace with actual DB logic)
        const fileRecord = {
            messageId: req.body.messageId,
            filePath: req.file.path,
            originalName: req.file.originalname,
            size: req.file.size
        };
        // await saveFileMetadataToDB(fileRecord);

        res.status(200).json({ message: 'File uploaded successfully', filePath: req.file.path });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

export default uploadRouter;
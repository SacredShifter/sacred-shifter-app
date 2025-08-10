import * as express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Set up storage for audio files
const storage = multer.diskStorage({
    destination: 'uploads/audio/',
    filename: (req, file, callback) => {
        const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
        callback(null, `${file.fieldname}-${uniqueSuffix}`);
    }
});

const upload = multer({ storage });
const audioRouter = express.Router();

// Define the upload endpoint for audio messages
audioRouter.post('/message/audio', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No audio file uploaded' });
        }

        // Save audio file details to database (pseudo-code, replace with actual DB logic)
        const audioRecord = {
            messageId: req.body.messageId,
            audioPath: req.file.path,
            originalName: req.file.originalname,
            size: req.file.size
        };
        // await saveAudioMetadataToDB(audioRecord);

        res.status(200).json({ message: 'Audio uploaded successfully', audioPath: req.file.path });
    } catch (error) {
        console.error('Error uploading audio:', error);
        res.status(500).json({ error: 'Audio upload failed' });
    }
});

export default audioRouter;

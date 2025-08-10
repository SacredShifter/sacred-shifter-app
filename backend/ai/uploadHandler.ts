import * as express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Setup multer for handling file uploads
const storage = multer.diskStorage({
    destination: 'uploads/ai/',
    filename: (req, file, callback) => {
        const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
        callback(null, `file-${uniqueSuffix}`);
    }
});

const upload = multer({ storage });
const aiUploadRouter = express.Router();

// Define the file upload endpoint
aiUploadRouter.post('/analyzeFile', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        console.log('File uploaded:', req.file);

        // Placeholder for invoking AI analysis logic
        // e.g., const analysisResult = await performAnalysis(filePath);

        res.status(200).json({ message: 'File uploaded successfully', filePath });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

export default aiUploadRouter;

import * as express from 'express';
import multer from 'multer';
// Setup multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

const fileUploadRouter = express.Router();

// Define the file upload endpoint
fileUploadRouter.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        console.log('File uploaded:', req.file);

        // Placeholder for file processing logic
        // e.g., await analyzeFile(filePath);

        res.status(200).json({ message: 'File uploaded successfully', filePath });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ error: 'File upload failed' });
    }
});

export default fileUploadRouter;

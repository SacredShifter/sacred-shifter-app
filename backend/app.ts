// Import necessary modules and routers
import express from 'express';
import fileUploadRouter from './ai/fileHandler';
import messengerUploadRouter from './messenger/upload';
import audioRouter from './messenger/audio';
import aiUploadRouter from './ai/uploadHandler';
import edgeFunctionRouter from './handlers/supabaseEdgeFunction'; // New router import

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Existing routes
app.use('/api/ai', fileUploadRouter);
app.use('/api/messenger', messengerUploadRouter);
app.use('/api/messenger', audioRouter);

// Integrate routers
app.use('/api/ai', aiUploadRouter);
app.use('/api', edgeFunctionRouter); // New Edge Function route

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
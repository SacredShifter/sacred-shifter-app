import express from 'express';
import axios from 'axios'; // Use axios for HTTP requests

const edgeFunctionRouter = express.Router();

// Define route to call the Supabase Edge Function
edgeFunctionRouter.post('/invoke-edge-function', async (req, res) => {
    try {
        // Replace 'YOUR_EDGE_FUNCTION_URL' with the actual edge function deployment URL
        const edgeFunctionUrl = 'https://YOUR_EDGE_FUNCTION_URL.supabase.co/functions/v1/execute';

        // Gather necessary request data
        const requestData = req.body;

        // Call the Supabase edge function
        const response = await axios.post(edgeFunctionUrl, requestData);

        // Send back the function's response
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error invoking edge function:', error.stack || error);
        res.status(500).json({ error: 'Failed to invoke edge function' });
    }
});

export default edgeFunctionRouter;
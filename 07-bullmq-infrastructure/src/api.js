import express from 'express';
import { emailQueue } from './queue.js';

const app = express();

app.use(express.json());

app.post('/welcome-email', async (req, res) => {
    const { to, subject, text } = req.body;
    
    await emailQueue.add('send-welcome-email', 
        { to, subject, text }, 
        {
            //delay : 300,
            attempts : 3,
            backoff : {
                type : 'exponential',
                delay : 100,
            }
        }
    );
    res.send({ message : 'Email job added to the queue', jobId: job.id });
});

app.listen(3007, () => {
    console.log('API server running on port 3007');
});
import express from 'express';
import Redis from 'ioredis';

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Enqueue a job 
app.post('/emails', async (req, res) => {
    const job = {
        to : req.body.to,
        subject: req.body.subject || 'No subject',
        body: req.body.body || 'No content',
        createdAt: new Date().toISOString() // this is must in a nob creation in queue
    }
    await redis.lpush(process.env.QUEUE_KEY, JSON.stringify(job));
    res.json({ enqueued: true, job});
});

// Dequeue a job 
app.get('/emails/process-one', async (req, res) => {
    const rawJob = await redis.rpop(process.env.QUEUE_KEY);
    if(!rawJob) {
        return res.status(404).json({ message: 'No job is available, queue is empty' });
    } else {
        // To do real work, here
        const job = JSON.parse(rawJob);
        //Simulate sending the email
        res.json({ message : 'Email sent', job});
    }
});

//DrawBacks:
// 1. if any crash happended during job processing then data will lost
// 2. if Queue is empty then processing worker will be idle 
// 3. No control over the concurrency of the workers
// 4. No priority support 
// 5. No proper error handling 
// 6. No rate limiting
// 7. No scheduling
// 8. No idempotency


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

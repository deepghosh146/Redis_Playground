import express from 'express';
import Redis from 'ioredis';

const app = express();

app.use(express.json());

const publisher = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

app.post('/notification', async (req, res) => {
    const { to, subject, text } = req.body;
    
    await publisher.publish('notifications', async (req, res) => {
        const payload = {
            title : req.body.title,
            body  : req.body.body,
            createdAt : new Date().toISOString()
        };
        const receivers = await publisher.publish('notifications', JSON.stringify(payload));
        res.json({
            message : 'Notification sent to ' + receivers + ' receivers'
        });
    });
});

app.listen(3007, () => {
    console.log('API server running on port 3007');
});
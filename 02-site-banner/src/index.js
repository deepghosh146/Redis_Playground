import express from 'express';
import Redis from 'ioredis';

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.post("/banner", async (req, res) => {
    await redis.set(process.env.BANNER_KEY, req.body.message || "Welcome to Redis Playground!");
    res.json({success : true});
});

app.get("/banner", async (req, res) => {
    const message = await redis.get(process.env.BANNER_KEY);
    if (!message){
        message = "Didn't got the message.";
    }
    res.json({success : true, message});
});

app.delete("/banner", async (req, res) => {
    await redis.del(process.env.BANNER_KEY);
    res.json({success : true});
});

app.get("/banner/exists", async (req, res) => {
    const exists = await redis.exists(process.env.BANNER_KEY);
    // this below line returns true / false
    //res.json({exists: Boolean(exists)});

    //this below line returns binary true / false
    res.json({exists: exists});
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

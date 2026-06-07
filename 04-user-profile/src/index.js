import express from 'express';
import Redis from 'ioredis';

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');


// Basic way via Json
app.post("/user/:id/json", async (req, res) => {
    await redis.set(`user:${req.params.id}:json`, JSON.stringify(req.body));
    res.json({savedAs: "json"});

});

app.get("/user/:id/json", async(req, res) => {
    const rawData = await redis.get(`user:${req.params.id}:json`);
    
    if(!rawData) {
        return res.status(404).json({message: "Not Found"});
    }
    res.json({ user: rawData ? JSON.parse(rawData) : null });
});

// Advanced way via Hash set 
app.post("/user/:id/hash", async (req, res) => {
  await redis.hset(`user:${req.params.id}:hash`, req.body);
  res.json({savedAs: "hash"});
})

// use hgetAll to get the entire object
app.get("/user/:id/hash", async(req, res) => {
    const rawData = await redis.hgetall(`user:${req.params.id}:hash`);

    if(!rawData) {
        return res.status(404).json({message: "Not Found"});
    }
    res.json({ user: rawData });
})

// use hgetall to get specific field 
app.get("/user/:id/hash/:field", async(req, res) => {
    const rawData = await redis.hget(`user:${req.params.id}:hash`, req.params.field);

    if(!rawData) {
        return res.status(404).json({message: "Not Found"});
    }
    res.json({ [req.params.field] : rawData });
})

// hset, hget, hdel, hexist

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

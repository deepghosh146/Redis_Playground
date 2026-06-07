import express from 'express';
import Redis from 'ioredis';

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

function postKey(id){
    return `post:${id}:likes`;
}

//set the like counter of a post
app.post('/post/:id/create', async (req, res) => {
    const {id} = req.params;
    await redis.set(postKey(id), 0);
    res.json({ message: 'Post created', postId: id });
});

//get the current like count in a post
app.get('/post/:id/getlike', async (req, res)=> {
    const {id} = req.params;
    const likes = await redis.get(postKey(id));
    res.json({ PostId: id, Likes: likes });
});

//incr
//like a post, increase counter in post
app.post('/post/:id/like', async (req, res)=> {
    const {id} = req.params;
    await redis.incr(postKey(id));
    res.json({ message: 'Liked', postId: id });
});

//Game LeaderBoard
function userKey(id){
    return `user:${id}:hash`;
}

function leaderBoardKey(){
    return `leaderboard:global`;
}

//create users in leaderboard
app.post('/leaderboard/create/user/:id',async(req,res)=>{
    await redis.hset(userKey(req.params.id), req.body);
    res.json({message:`User created with id: ${req.params.id}`});
});

// get the user in leaderboard
app.get("/leaderboard/user/:id", async(req, res)=>{
    const {id} = req.params;
    if(await redis.exists(userKey(id)) === 0){
        return res.status(404).json({message: "User not found"});
    }
    const rawData = await redis.hgetall(userKey(id));
    res.json({ user: rawData });
});

// update the user
app.put("/leaderboard/update/user/:id", async (req,res)=>{
    const {id} = req.params;
    if(await redis.exists(userKey(id)) === 0){
        return res.status(404).json({message: "User not found"});
    }
    const oldData = await redis.hgetall(userKey(id));
    await redis.hset(userKey(id), req.body);
    const newData = await redis.hgetall(userKey(id));
    res.json({ message: "User updated", oldData: oldData, newData: newData});
});

// delete the user from leaderboard
app.delete("/leaderboard/user/:id", async (req,res)=>{
    const {id} = req.params;
    if(await redis.exists(userKey(id)) === 0){
        return res.status(404).json({message: "User not found"});
    }
    await redis.del(userKey(id));
    res.json({ message: "User deleted", id});
});


// add point to user score (zincrby)
/*
1. What is the "Object"?
The "Object" is the User Profile stored as a Redis Hash.

Key: user:123:hash (This is what userKey(id) returns)
What it stores: All the details about a specific user (e.g., name: "Alice", email: "alice@test.com", score: 100).
Redis Commands used: hset, hgetall, hincrby
Limitation: A hash is just a dictionary of fields and values. It has no idea who has the highest score compared to other users.
2. What is the "Global"?
The "Global" is the Leaderboard stored as a Redis Sorted Set.

Key: leaderboard:global (This is what leaderBoardKey() returns)
What it stores: A giant list of every user's ID and their score, automatically sorted by rank (e.g., user 123 has 100, user 456 has 80).
Redis Commands used: zincrby, zscore, zrevrange
Limitation: A sorted set only stores a score and a member string (the ID). It cannot store the user's name or email.
Why do we need both?
Because of their limitations!

We use the Global Sorted Set to quickly calculate rankings (who is 1st, 2nd, 3rd).
We use the User Object Hash to look up their name and profile info once we know who is in 1st place.
Why are the scores not the same?
Because they are two entirely separate pieces of data in the Redis database! When a user earns points, you must update both places to keep them in sync. If you update the Global Leaderboard but forget to update the User Object, they will show different numbers.
*/
app.post("/leaderboard/score/increment/:incr/:id", async(req, res)=> {
    const {incr, id} = req.params;
    if(await redis.exists(userKey(id)) === 0){
        return res.status(404).json({message: "User not found"});
    }
    //update the user object.
    await redis.hincrby(userKey(id), "score", incr);

    //update the global leaderboard.
    await redis.zincrby(leaderBoardKey(), incr, id);

    // Get the updated score from global leaderboard.
    const updatedScore = await redis.zscore(leaderBoardKey(), id);
    
    res.json({ message: `Score updated for user with id: ${id}, new score: ${updatedScore}`});
});

// get the top N users from the leaderboard
app.get("/leaderboard/top/:n", async (req, res)=> {
    const {n} = req.params;
    // returns the list of user ids from the global leaderboard in descending order.
    const users = await redis.zrevrange(leaderBoardKey(), 0, n-1);
    res.json({ users });
});

// get user's rank
app.get("/leaderboard/rank/:id", async (req, res)=> {
    const {id} = req.params;
    if(await redis.exists(userKey(id)) === 0){
        return res.status(404).json({message: "User not found"});
    }
    // returns user's rank in the global leaderboard in descending order.
    const rank = await redis.zrevrank(leaderBoardKey(), id);
    res.json({ rank });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

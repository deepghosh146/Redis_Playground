import express from 'express';
import Redis from 'ioredis';

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

function otpKey(phone) {
    return `otp:${phone}`;
}

app.post('/otp', async (req, res) => {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await redis.set(otpKey(phone), otp, 'EX', 30); // OTP valid for 30 seconds
    res.json({message: 'OTP sent successfully.', otp}); // In real application, send OTP via SMS

    // meta data that can be sent in place of "EX"
    /*{
        otp: "",
        attemps: 0,
        maxAttempts: 3,
        creatredAt: timestamp,
        lastAttempt: timestamp,
        blockedUntil: timestamp, //optional
    }*/
})

app.post('/otp/verify', async (req, res) => {
    const {phone, otp} = req.body;
    const savedOtp = await redis.get(otpKey(phone));

    if(!savedOtp) {
        return res.status(400).json({message: 'OTP expired or not found.'});
    }

    if(savedOtp !== otp) {
        return res.status(400).json({message: 'Invalid OTP.'});
    }

    await redis.del(otpKey(phone));
    res.json({message: 'OTP verified successfully.'});
});

app.get("/otp/:phone/ttl", async (req, res) => {
   const ttl = await redis.ttl(otpKey(req.params.phone));
   res.json({ttl}); 
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

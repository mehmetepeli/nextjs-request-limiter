import {NextResponse} from "next/server";
import {Redis} from "ioredis";
import axios from "axios";

let requestLimit = 10;
let tokens = requestLimit;
let lastRefill = Date.now(); // Current unix timestamp
const refillRate = 60000; // 1000ms = 1s
export async function POST(req: Request) {
    const DEFAULT_EXPIRATION = 3600;
    const redisClient = Redis.createClient();
    let result = {}

    try {
        const body = await req.json();
        const {albumId} = body;

        const result = await getOrSetCache(`posts?albumId=${albumId}`, async () => {
            const {data} = await axios.get("https://jsonplaceholder.typicode.com/photos", { params: { albumId } });
            return data
        });

        refillTokens();

        if (tokens > 0) {
            tokens -= 1;

            return NextResponse.json(result, { status: 200 });
        }

        return NextResponse.json({ message: 'Rate limit exceeded!' }, { status: 429 });

    } catch (e) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}

function getOrSetCache(key, callback) {
    const DEFAULT_EXPIRATION = 3600;
    const redisClient = Redis.createClient();

    return new Promise((resolve, reject) => {
        redisClient.get(key, async (error, data) => {
            if (error) {
                return reject(error);
            }

            if (data != null) {
                return resolve(JSON.parse(data))
            }

            const freshing = await callback()
            redisClient.setex(key, DEFAULT_EXPIRATION, JSON.stringify(freshing))
            resolve(freshing)
        })
    })
}

const refillTokens = () => {
    const now = Date.now();
    const timeElapsed = now - lastRefill;
    const tokensToAdd = Math.floor(timeElapsed / refillRate);

    if (tokensToAdd > 0) {
        tokens = Math.min(requestLimit, tokens + tokensToAdd);
        lastRefill = now;
    }
};
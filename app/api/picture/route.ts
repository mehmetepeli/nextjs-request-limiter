import {NextResponse} from "next/server";
import {Memory} from "@/lib/memory";
import {RequestLimiter} from "@/lib/requestLimiter";
import axios from "axios";
const caching = new Memory();
const requestLimiter = new RequestLimiter();
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {albumId} = body;
        const {data} = await axios.get("https://jsonplaceholder.typicode.com/photos", { params: { albumId } });

        const keys = {
            id: albumId,
            name: "testName",
            expiration: 3600
        };

        const limiterKeys = {
            id: 1,
            name: "limiter",
            expiration: requestLimiter.refillRate / 60 // millisecond / second
        }

        requestLimiter.refillTokens();
        let tokens = requestLimiter.tokens;

        let checkLimiter: string = await caching.readHistory(limiterKeys);
        let limit = 0;

        if (checkLimiter === null){
            const createLimiterRecord = await caching.writeHistory(limiterKeys, tokens);
            limit = tokens;
        } else {
            limit = parseInt(checkLimiter)
        }

        if (limit > 0) {
            limit -= 1;

            await caching.writeHistory(limiterKeys, limit);

            const checkRecords = await caching.readHistory(keys);

            if (checkRecords != null) {
                return NextResponse.json(checkRecords, { status: 200 });
            }

            const createRecord = await caching.writeHistory(keys, data);

            return NextResponse.json(checkRecords, { status: 200 });
        }

        return Response.json({ message: 'Rate limit exceeded!' }, { status: 429 });

    } catch (e) {
        return new NextResponse("Internal Error: "+e, { status: 500 })
    }
}
import {NextResponse} from "next/server";
import {Memory} from "@/lib/memory";
import {RequestLimiterWithIP} from "@/lib/requestLimiterWithIP";
import axios from "axios";
const caching = new Memory();
const requestLimiterWithIP = new RequestLimiterWithIP();
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
            expiration: requestLimiterWithIP.refillRate / 60 // millisecond / second
        }

        const ip = requestLimiterWithIP.getIP();
        const ipRequests = requestLimiterWithIP.ipLists;

        if (!ipRequests[ip]) {
            ipRequests[ip] = [];
        }

        ipRequests[ip] = requestLimiterWithIP.cleanOldRequests(ipRequests[ip]);

        let tokens = requestLimiterWithIP.requestLimit;

        let checkLimiter: string = await caching.readHistory(limiterKeys);
        let limit = 0;

        if (checkLimiter === null){
            const createLimiterRecord = await caching.writeHistory(limiterKeys, tokens);
            limit = tokens;
        } else {
            limit = parseInt(checkLimiter)
        }

        if (limit > ipRequests[ip].length) {

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
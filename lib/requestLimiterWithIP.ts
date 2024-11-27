import {headers} from "next/headers";

export class RequestLimiterWithIP {
    public requestLimit = 10;
    public refillRate = 60000; // 1000ms = 1s
    public ipLists = {};

    public constructor() {}

    public cleanOldRequests = (timestamp) => {
        const now = Date.now();
        return timestamp.filter((timestamp) => now - timestamp < this.refillRate);
    }

    public getIP = () => {
        const forwardedFor = headers().get("x-forwarded-for");
        const realIP = headers().get("x-real-ip");

        if (forwardedFor) {
            return forwardedFor.split(",")[0].trim();
        }

        if (realIP) {
            return realIP.trim();
        }

        return null;
    }
}
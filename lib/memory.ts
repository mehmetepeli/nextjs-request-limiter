import {Redis} from "ioredis";

export type RedisKey = {
    id: any;
    name: string;
    expiration: number | 3600;
}

export class Memory {
    private static instance: Memory;
    private history: Redis;
    public constructor() {
        this.history = Redis.createClient();
    }

    private generateRedisKey(redisKey: RedisKey): string {
        return `${redisKey.name}-${redisKey.id}`;
    }

    public async writeHistory(redisKey: RedisKey, data) {
        if (!redisKey || typeof redisKey.name == "undefined") {
            console.error("Error");
            return "";
        }

        const key = this.generateRedisKey(redisKey);
        const expiration = redisKey.expiration;

        let result = await this.history.setex(key, expiration, JSON.stringify(data));
        return result;
    }

    public async readHistory(redisKey: RedisKey): Promise<string> {
        if (!redisKey || typeof redisKey.name == "undefined") {
            console.error("Error");
            return "";
        }

        const key = this.generateRedisKey(redisKey);
        const expiration = redisKey.expiration;

        let result = await this.history.get(key);
        return JSON.parse(result)
    }
}
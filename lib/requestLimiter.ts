export class RequestLimiter {
    public requestLimit = 10;
    public tokens = this.requestLimit;
    public lastRefill = Date.now(); // Current unix timestamp
    public refillRate = 60000; // 1000ms = 1s

    public constructor() {}

    public refillTokens = () => {
        const now = Date.now();
        const timeElapsed = now - this.lastRefill;
        const tokensToAdd = Math.floor(timeElapsed / this.refillRate);

        if (tokensToAdd > 0) {
            this.tokens = Math.min(this.requestLimit, this.tokens + tokensToAdd);
            this.lastRefill = now;
        }
    }
}
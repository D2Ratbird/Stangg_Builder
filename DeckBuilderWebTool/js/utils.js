class RateLimiter {
    constructor(maxRequests = 10, timeWindow = 1000) {
        this.maxRequests = maxRequests;
        this.timeWindow = timeWindow;
        this.requests = [];
    }

    async throttle() {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.timeWindow);
        
        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = this.requests[0];
            const waitTime = this.timeWindow - (now - oldestRequest);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.requests.push(now);
    }
}

const globalRateLimiter = new RateLimiter(10, 1000);

class Database {
        constructor() {
            this.localData = null;
        }
    
        async initialize() {
            // Your existing database initialization logic here
        }
    
        async downloadDatabase() {
            // Your existing download logic here
        }
    }
    
    
    function formatManaText(text) {
        if (!text) return '';
        return text
            .replace(/\{T\}/g, '<i class="ms ms-tap ms-cost"></i>')
            .replace(/\{([^}]+)\}/g, (match, symbol) => {
                return `<i class="ms ms-${symbol.toLowerCase()} ms-cost"></i>`;
            });
    }
       
    function calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
    
        if (longer.length === 0) return 1.0;
        return (longer.length - editDistance(longer, shorter)) / longer.length;
    }

    function editDistance(str1, str2) {
        // Add your existing edit distance calculation here
        // This is needed for the calculateSimilarity function
    }
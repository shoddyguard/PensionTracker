import { RateLimiterMemory } from "rate-limiter-flexible";

// 5 failed attempts per username:IP key, then a 15-minute lockout.
// Counters live in memory — reset on container restart, which is acceptable
// for a single-instance deployment. Swap RateLimiterMemory for
// RateLimiterRedis + an ioredis client if you ever scale to multiple instances.
export const loginLimiter = new RateLimiterMemory({
  points: 5,
  duration: 15 * 60,
  blockDuration: 15 * 60,
});

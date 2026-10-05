const redis = require("../lib/redisClient");

(async () => {
  await redis.set("testKey", "hello", "EX", 60);
  const value = await redis.get("testKey");
  console.log("Value:", value);
  process.exit(0);
})();

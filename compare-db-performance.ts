const { MongoClient } = require("mongodb");
const { performance: perf } = require("perf_hooks");
const dotenv = require("dotenv");

dotenv.config();

interface PerformanceResult {
  url: string;
  connectTime: number;
  queryTime: number;
  totalTime: number;
  averageConnectTime: number;
  averageQueryTime: number;
  averageTotalTime: number;
}

async function testMongoPerformance(
  url: string,
  iterations: number = 3
): Promise<PerformanceResult> {
  // Clean the URL by removing trailing characters and quotes
  const cleanUrl = url
    .trim()
    .replace(/[\/\s"']+$/, "")
    .replace(/^["']/, "");

  let totalConnectTime = 0;
  let totalQueryTime = 0;
  let totalTime = 0;

  for (let i = 0; i < iterations; i++) {
    const startConnect = perf.now();
    const client = await MongoClient.connect(cleanUrl);
    const connectTime = perf.now() - startConnect;
    totalConnectTime += connectTime;

    const startQuery = perf.now();
    const db = client.db("test");
    await db.collection("test").find({}).limit(1).toArray();
    const queryTime = perf.now() - startQuery;
    totalQueryTime += queryTime;

    totalTime += connectTime + queryTime;
    await client.close();
  }

  return {
    url: cleanUrl,
    connectTime: totalConnectTime,
    queryTime: totalQueryTime,
    totalTime: totalTime,
    averageConnectTime: totalConnectTime / iterations,
    averageQueryTime: totalQueryTime / iterations,
    averageTotalTime: totalTime / iterations,
  };
}

async function rankMongoPerformance(
  urls: string[],
  iterations: number = 3
): Promise<PerformanceResult[]> {
  const results: PerformanceResult[] = [];

  for (const url of urls) {
    try {
      const result = await testMongoPerformance(url, iterations);
      results.push(result);
    } catch (error) {
      console.error(`Error testing ${url}:`, error);
    }
  }

  // Sort by average total time ascending
  return results.sort((a, b) => a.averageTotalTime - b.averageTotalTime);
}

// Get MongoDB URLs from environment variables
const mongoUrls = process.env.MONGO_URLS?.split(",") || [];
const iterations = Number(process.env.TEST_ITERATIONS) || 3;

rankMongoPerformance(mongoUrls, iterations)
  .then((results) => {
    console.log(`Performance Rankings (${iterations} iterations):`);
    results.forEach((result, index) => {
      console.log(`\n#${index + 1} - ${result.url}`);
      console.log(
        `Average Connect Time: ${result.averageConnectTime.toFixed(2)}ms`
      );
      console.log(
        `Average Query Time: ${result.averageQueryTime.toFixed(2)}ms`
      );
      console.log(
        `Average Total Time: ${result.averageTotalTime.toFixed(2)}ms`
      );
      console.log(`Total Connect Time: ${result.connectTime.toFixed(2)}ms`);
      console.log(`Total Query Time: ${result.queryTime.toFixed(2)}ms`);
      console.log(`Total Time: ${result.totalTime.toFixed(2)}ms`);
    });
  })
  .catch((error) => {
    console.error("Error running performance tests:", error);
  });

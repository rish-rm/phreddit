// Benchmarks the paginated post listing. Start the server against the bench
// database first:
//   MONGO_URI=mongodb://127.0.0.1:27017/phreddit_bench npm start
// Then: npm run bench
import autocannon from "autocannon";

const TARGET = process.env.BENCH_URL || "http://127.0.0.1:8000/api/posts?limit=20";

const result = await autocannon({
  url: TARGET,
  connections: Number(process.env.BENCH_CONNECTIONS || 50),
  duration: Number(process.env.BENCH_DURATION || 15)
});

console.log(autocannon.printResult(result));
console.log(
  `\nSummary: ${result.requests.average.toFixed(0)} req/s avg, ` +
  `p50 ${result.latency.p50}ms, p97.5 ${result.latency.p97_5}ms, p99 ${result.latency.p99}ms`
);

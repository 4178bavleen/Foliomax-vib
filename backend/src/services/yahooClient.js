const YahooFinance = require("yahoo-finance2").default;

const yahooFinance = new YahooFinance({
  queue: { concurrency: 1, timeout: 15000 },
  suppressNotices: ["yahooSurvey"]
});

module.exports = yahooFinance;

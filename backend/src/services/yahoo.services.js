const yahooFinance = require("./yahooClient");

const CACHE_TTL = 60 * 1000; // 1 minute
let cache = { data: null, expiry: 0 };

exports.fetchYahooQuotes = async (symbols) => {
  try {
    if (cache.data && Date.now() < cache.expiry) {
      return cache.data;
    }

    const quotes = await yahooFinance.quote(symbols, {
      fields: [
        "symbol",
        "regularMarketPrice",
        "regularMarketChange",
        "regularMarketChangePercent",
        "regularMarketDayLow",
        "regularMarketDayHigh",
        "shortName",
        "longName"
      ]
    });

    const results = (Array.isArray(quotes) ? quotes : [quotes])
      .filter(q => q?.regularMarketPrice != null)
      .map(item => {
        const price = item.regularMarketPrice;
        const low = item.regularMarketDayLow ?? price;
        const high = item.regularMarketDayHigh ?? price;

        return {
          symbol: item.symbol,
          name: item.shortName || item.longName || item.symbol,
          price: Number(price.toFixed(2)),
          change: Number((item.regularMarketChange || 0).toFixed(2)),
          changePercent: Number((item.regularMarketChangePercent || 0).toFixed(2)),
          rangePercent:
            high !== low
              ? Math.min(Math.max(((price - low) / (high - low)) * 100, 0), 100)
              : 50,
          history: generateSparkline(price)
        };
      });

    cache = {
      data: results,
      expiry: Date.now() + CACHE_TTL
    };

    return results;
  } catch (error) {
    console.error("Yahoo batch error:", error.message);
    throw error;
  }
};

function generateSparkline(price) {
  let base = price;
  return Array.from({ length: 12 }, () => {
    base += (Math.random() - 0.5) * price * 0.003;
    return Number(base.toFixed(2));
  });
}

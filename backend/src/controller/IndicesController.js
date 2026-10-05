const YahooFinance = require("yahoo-finance2").default;

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

exports.getIndices = async (req, res) => {
  try {
    const indices = [
      { symbol: "^NSEI", name: "NIFTY 50" },
      { symbol: "^NSEBANK", name: "BANK NIFTY" },
      { symbol: "^CNX100", name: "NIFTY 100" },
      { symbol: "^CNX200", name: "NIFTY 200" },
      { symbol: "^CNX500", name: "NIFTY 500" }
    ];

    const quotes = await Promise.all(
      indices.map(i =>
        yahooFinance.quote(i.symbol).catch(() => null)
      )
    );

    const result = quotes
      .map((q, idx) => {
        if (!q || q.regularMarketPrice == null) return null;

        return {
          type: "INDEX",
          symbol: indices[idx].name,
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: q.regularMarketChangePercent,
        };
      })
      .filter(Boolean);

    res.json(result);
  } catch (err) {
    console.error("Yahoo error:", err);
    res.status(500).json({ message: "Failed to fetch market data" });
  }
};

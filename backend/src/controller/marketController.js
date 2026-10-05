const yahooFinance = require("../services/yahooClient");

const CACHE_TTL = 60 * 1000;
let cache = { data: null, expiry: 0 };

exports.getNsePrices = async (req, res) => {
  try {
    if (cache.data && Date.now() < cache.expiry) {
      return res.json(cache.data);
    }

    const symbols = [
      "ADANIENT.NS","ADANIPORTS.NS","APOLLOHOSP.NS","ASIANPAINT.NS",
      "AXISBANK.NS","BAJAJ-AUTO.NS","BAJFINANCE.NS","BAJAJFINSV.NS",
      "BHARTIARTL.NS","BPCL.NS","BRITANNIA.NS","CIPLA.NS",
      "COALINDIA.NS","DIVISLAB.NS","DRREDDY.NS","EICHERMOT.NS",
      "GRASIM.NS","HCLTECH.NS","HDFCBANK.NS","HDFCLIFE.NS",
      "HEROMOTOCO.NS","HINDALCO.NS","HINDUNILVR.NS","ICICIBANK.NS",
      "INDUSINDBK.NS","INFY.NS","ITC.NS","JSWSTEEL.NS",
      "KOTAKBANK.NS","LT.NS","M&M.NS","MARUTI.NS",
      "NESTLEIND.NS","NTPC.NS","ONGC.NS","POWERGRID.NS",
      "RELIANCE.NS","SBILIFE.NS","SBIN.NS","SUNPHARMA.NS",
      "TATACONSUM.NS","TATAMOTORS.NS","TATASTEEL.NS","TCS.NS",
      "TECHM.NS","TITAN.NS","ULTRACEMCO.NS","UPL.NS","WIPRO.NS"
    ];

    const quotes = await yahooFinance.quote(symbols);

    const result = quotes
      .filter(q => q?.regularMarketPrice != null)
      .map(q => ({
        symbol: q.symbol.replace(".NS", ""),
        price: q.regularMarketPrice,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0
      }));

    cache = {
      data: result,
      expiry: Date.now() + CACHE_TTL
    };

    res.json(result);
  } catch (err) {
    console.error("Yahoo NSE error:", err.message);
    res.status(503).json({ message: "Market data temporarily unavailable" });
  }
};

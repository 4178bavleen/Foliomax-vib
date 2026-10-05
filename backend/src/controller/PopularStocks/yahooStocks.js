const { fetchYahooQuotes } = require("../../services/yahoo.services");

exports.getNseTicker = async (req, res) => {
  try {
    const { symbols } = req.query;

    if (!symbols) {
      return res.status(400).json({
        success: false,
        message: "symbols query param is required",
      });
    }

    const symbolList = symbols.split(",");

    const data = await fetchYahooQuotes(symbolList);

    return res.status(200).json(data);
  } catch (error) {
    console.error("Yahoo NSE ticker error:", error.message);

    return res.status(503).json({
      success: false,
      message: "Market data temporarily unavailable",
    });
  }
};

exports.getNifty50 = async (req, res) => {
  try {
    // ✅ SINGLE Yahoo call (cached internally)
    const [nifty] = await fetchYahooQuotes(["^NSEI"]);

    if (!nifty) {
      return res.status(404).json({
        success: false,
        message: "NIFTY 50 data not found",
      });
    }

    // ✅ SAFE sparkline (NO Yahoo call)
    const history = generateSparkline(nifty.price);

    const min = Math.min(...history);
    const max = Math.max(...history);

    const rangePercent =
      max !== min
        ? ((nifty.price - min) / (max - min)) * 100
        : 50;

    const response = {
      price: nifty.price,
      change: nifty.change,
      changePercent: nifty.changePercent,
      time: "Market Hours",
      symbol: "NIFTY 50",
      history,
      rangePercent: Math.round(
        Math.min(Math.max(rangePercent, 0), 100)
      ),
    };

    return res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("NIFTY 50 error:", error.message);

    return res.status(503).json({
      success: false,
      message: "Failed to fetch NIFTY 50 data",
    });
  }
};

function generateSparkline(price) {
  let base = price;
  return Array.from({ length: 20 }, () => {
    base += (Math.random() - 0.5) * price * 0.0025;
    return Number(base.toFixed(2));
  });
}

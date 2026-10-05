const axios = require("axios");

exports.fetchYahooChart = async (
  symbol,
  range = "1d",
  interval = "10m"
) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

  const { data } = await axios.get(url, {
    params: { range, interval },
  });

  const result = data?.chart?.result?.[0];
  if (!result) return [];

  // closing prices for sparkline
  return result.indicators.quote[0].close.filter(Boolean);
};

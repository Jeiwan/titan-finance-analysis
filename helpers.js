const moment = require("moment");
const utils = require("web3").utils;

function formatBigString(s) {
  return parseFloat(s).toLocaleString();
}

function formatDate(date) {
  return moment.utc(date).format("MMM, DD HH:mm");
}

function wmaticPrice(wmaticReserve, usdcReserve) {
  return (
    utils.fromWei(usdcReserve, "mwei") / utils.fromWei(wmaticReserve, "ether")
  ).toFixed(4);
}

function titanPrice(titanReserve, wmaticReserve, wmaticPrice) {
  return (
    (utils.fromWei(wmaticReserve, "ether") /
      utils.fromWei(titanReserve, "ether")) *
    wmaticPrice
  ).toFixed(4);
}

function arbProfit(ironPrice, titanPrice, titanPriceAMM, ecr) {
  const usdcValue = 1.0 * ecr;
  const titanValue = 1.0 * (1 - ecr);
  const titanAmount = titanValue / titanPrice;

  return (usdcValue + titanAmount * titanPriceAMM - ironPrice).toFixed(4);
}

module.exports = {
  formatBigString: formatBigString,
  formatDate: formatDate,
  wmaticPrice: wmaticPrice,
  titanPrice: titanPrice,
  arbProfit: arbProfit,
};

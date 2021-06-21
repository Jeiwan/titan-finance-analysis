const data = require("./data.json");
const { arbProfit } = require("./helpers.js");

const newData = Object.entries(data).reduce(function (m, p) {
  const [k, v] = p;
  const simECR = (parseFloat(v["ECR"]) * 1.15).toFixed(4);
  const simArbProfit =
    parseFloat(v["IRON price"]) > 1.0
      ? null
      : arbProfit(
          parseFloat(v["IRON price"]),
          parseFloat(v["TITAN price"]),
          parseFloat(v["TITAN price, AMM"]),
          simECR
        );

  v["Arb profit, simulated"] = simArbProfit;
  v["ECR, simulated"] = simECR;

  delete v["TCR"];
  delete v["IRON total supply"];
  delete v["TITAN total supply"];

  m[k] = v;

  return m;
}, {});

console.table(newData);

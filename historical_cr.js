const fs = require("fs");
const Web3 = require("web3");
const fetch = require("node-fetch");
const treasuryABI = require("./treasury.json");
const { formatDate } = require("./helpers.js");

const utils = Web3.utils;
const treasuryAddress = "0x376b9e0abbde0ca068defcd8919ca73369124825";
const nodeURL = process.env.ARCHIVE_NODE_URL; // Get one from https://moralis.io/, use a 'Mainnet Archive' speedy Polygon node

const timestampToBlockNum = async (timestamp) => {
  return fetch(
    `https://api.polygonscan.com/api?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=YourApiKeyToken`
  )
    .then((res) => res.json())
    .then((res) => {
      if (res.status === "1") {
        return parseInt(res.result);
      } else {
        throw Error(res.message);
      }
    });
};

// ============================================================

const web3 = new Web3(new Web3.providers.HttpProvider(nodeURL));
const treasury = new web3.eth.Contract(treasuryABI, treasuryAddress);

const hour = 3600;
const startTime = Math.ceil(1622274115 / hour) * hour; // Treasury creation time
const endTime = Math.ceil(1623891602 / hour) * hour; // June 17, 2 AM

(async () => {
  const data = JSON.parse(fs.readFileSync("data_cr.json"));

  for (let i = startTime; i <= endTime; i += hour) {
    console.log("Collecting data, timestamp ", i);

    const blockNumber = await timestampToBlockNum(i);

    const [block, dollarPrice, sharePrice, tcr, ecr] = await Promise.all([
      web3.eth.getBlock(blockNumber),
      treasury.methods.dollarPrice().call({}, blockNumber),
      treasury.methods.sharePrice().call({}, blockNumber),
      treasury.methods.target_collateral_ratio().call({}, blockNumber),
      treasury.methods.effective_collateral_ratio().call({}, blockNumber),
    ]);

    data[blockNumber] = {
      Date: formatDate(new Date(block.timestamp * 1000)),
      "IRON price": utils.fromWei(dollarPrice, "mwei"),
      "TITAN price": utils.fromWei(sharePrice, "mwei"),
      TCR: parseFloat(utils.fromWei(tcr, "mwei")).toFixed(6),
      ECR: parseFloat(utils.fromWei(ecr, "mwei")).toFixed(6),
    };

    fs.writeFileSync("data_cr.json", JSON.stringify(data));
  }

  console.table(data);
})();

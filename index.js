const fs = require("fs");
const Web3 = require("web3");
const utils = Web3.utils;
const dollarABI = require("./dollar.json");
const shareABI = require("./share.json");
const treasuryABI = require("./treasury.json");
const pairABI = require("./pair.json");
const moment = require("moment");

const nodeURL = process.env.ARCHIVE_NODE_URL; // Get one from https://moralis.io/, use a 'Mainnet Archive' speedy Polygon node
const nodeURL2 = "https://rpc-mainnet.maticvigil.com";

const dollarAddress = "0xd86b5923f3ad7b585ed81b448170ae026c65ae9a";
const shareAddress = "0xaaa5b9e6c589642f98a1cda99b9d024b8407285a";
const treasuryAddress = "0x376b9e0abbde0ca068defcd8919ca73369124825";
const pairTitanAddress = "0xa79983daf2a92c2c902cd74217efe3d8af9fba2a";
const pairMaticAddress = "0xcd353f79d9fade311fc3119b841e1f456b54e858";

const startBlock = 15764168;
const blocksPerHour = 1600;

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

// ============================================================

const web3 = new Web3(new Web3.providers.HttpProvider(nodeURL));
const web3scan = new Web3(new Web3.providers.HttpProvider(nodeURL2));

const dollar = new web3.eth.Contract(dollarABI, dollarAddress);
const share = new web3.eth.Contract(shareABI, shareAddress);
const treasury = new web3.eth.Contract(treasuryABI, treasuryAddress);
const pairTitan = new web3scan.eth.Contract(pairABI, pairTitanAddress);
const pairMatic = new web3scan.eth.Contract(pairABI, pairMaticAddress);

async function collectData() {
  let data = JSON.parse(fs.readFileSync("data.json"));

  for (let i = 0; i < 49; i++) {
    const blockNumber = startBlock + i * Math.floor(blocksPerHour / 2);

    console.log("Collecting data, iteration ", i, ", block ", blockNumber);

    const results = await Promise.all([
      web3.eth.getBlock(blockNumber),
      dollar.methods.totalSupply().call({}, blockNumber),
      share.methods.totalSupply().call({}, blockNumber),
      treasury.methods.dollarPrice().call({}, blockNumber),
      treasury.methods.sharePrice().call({}, blockNumber),
      treasury.methods.globalCollateralBalance().call({}, blockNumber),
      treasury.methods.target_collateral_ratio().call({}, blockNumber),
      treasury.methods.effective_collateral_ratio().call({}, blockNumber),
      pairTitan.getPastEvents("Sync", {
        fromBlock: blockNumber - 10,
        toBlock: blockNumber,
      }),
      pairMatic.getPastEvents("Sync", {
        fromBlock: blockNumber - 10,
        toBlock: blockNumber,
      }),
    ]);

    const [
      block,
      dollarSupply,
      shareSupply,
      dollarPrice,
      sharePrice,
      usdcReserve,
      tcr,
      ecr,
      titanSyncs,
      maticSyncs,
    ] = results;

    const maticSync = maticSyncs && maticSyncs[maticSyncs.length - 1];
    let maticUSD;

    if (maticSync) {
      maticUSD = wmaticPrice(
        maticSync.returnValues.reserve0,
        maticSync.returnValues.reserve1
      );
    } else {
      console.error("Missing MATIC sync");
    }

    const titanSync = titanSyncs && titanSyncs[titanSyncs.length - 1];
    let titanUSD;

    if (titanSync && maticSync) {
      titanUSD = titanPrice(
        titanSync.returnValues.reserve1,
        titanSync.returnValues.reserve0,
        maticUSD
      );
    } else {
      console.error("Missing TITAN sync");
    }

    const ironPrice = utils.fromWei(dollarPrice, "mwei");

    data[blockNumber] = {
      Date: formatDate(new Date(block.timestamp * 1000)),
      "IRON total supply": formatBigString(
        utils.fromWei(dollarSupply, "ether")
      ),
      "TITAN total supply": formatBigString(
        utils.fromWei(shareSupply, "ether")
      ),
      "IRON price": ironPrice,
      "TITAN price": utils.fromWei(sharePrice, "mwei"),
      "TITAN price, AMM": titanUSD,
      "Arb profit":
        parseFloat(ironPrice) > 1.0
          ? NaN
          : arbProfit(
              utils.fromWei(dollarPrice, "mwei"),
              utils.fromWei(sharePrice, "mwei"),
              titanUSD,
              parseFloat(utils.fromWei(ecr, "mwei"))
            ),
      TCR: utils.fromWei(tcr, "mwei"),
      ECR: utils.fromWei(ecr, "mwei"),
    };

    fs.writeFileSync("data.json", JSON.stringify(data));
  }

  console.table(data);
}

collectData();

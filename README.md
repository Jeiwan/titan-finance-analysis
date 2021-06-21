## Analysis of the TITAN fall

Read blog post:  
[Analysis of the TITAN fall](https://jeiwan.net/posts/analysis-titan-fall/)

### Usage

1. Install dependencies first:
   ```shell
   $ yarn
   ```
1. I've committed full data (`data.json`), so you don't neeed to re-download it.  
   Run this to print full data:
   ```shell
   $ node print.js
   ```
   Run this to see simulated arbitraging profits with ERC increased by 15%:
   ```shell
   $ node simulate_ecr.js
   ```
1. If you want to re-download all the data, go to [moralis.io](https://moralis.io), register, find a speedy Polygon
   node, and copy a mainnet archive node URL. Set it to `ARCHIVE_NODE_URL` env. variable. Then run:
   ```shell
   $ node index.js
   ```

import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import dotenv from "dotenv";
dotenv.config();

const config = {
  solidity: "0.8.20",
  networks: {
    arbitrumSepolia: {
      url: process.env.ARBITRUM_SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 421614,
    },
  },
  etherscan: {
    apiKey: {
      arbitrumSepolia: process.env.ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "arbitrumSepolia",
        chainId: 421614,
        urls: {
          // ✅ URL V2 oficial com chainid
          apiURL: "https://api.etherscan.io/v2/api?chainid=421614",
          browserURL: "https://sepolia.arbiscan.io",
        },
      },
    ],
  },
};

export default config;

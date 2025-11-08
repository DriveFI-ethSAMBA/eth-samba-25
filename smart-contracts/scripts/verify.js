import pkg from "hardhat";
const { run } = pkg;

async function main() {
  console.log("🔍 Starting verification on Arbiscan...\n");

  // === Endereços já implantados ===
  const carNftAddress = "0xd4F5eA0C93E18013FB26C9C695d227B5B1bfE7e5";
  const usdtAddress = "0x83aF0D6616D3443b30940ac195CD4E8a717deC94";
  const saleAddress = "0xA60c6BE2192815b037F52ebcd7bb56e8a3C24759";

  // === Parâmetros de construtor ===
  const deployer = "0xF9Af724285C8Da1C77c1de48CF661eA7dFF0b399"; // 👉 opcional: pode deixar em branco se não quiser usar
  const seller = deployer;
  const buyer = "0x0E0c83055E06f8FAbeFf8A6E81cF71b579E2479E"; // endereço do comprador (adicione se quiser precisão)
  const users = [seller, buyer];
  const totalInstallments = 12;
  const installmentAmount = ethers.parseUnits("10", 6); // 10 USDT

  // === Função auxiliar ===
  const verify = async (name, address, args) => {
    try {
      console.log(`⏳ Verifying ${name} at ${address}...`);
      await run("verify:verify", {
        address,
        constructorArguments: args,
      });
      console.log(`✅ Verified ${name}\n`);
    } catch (e) {
      console.log(`⚠️  ${name} verification failed or skipped: ${e.message}\n`);
    }
  };

  // === Execução das verificações ===
  await verify("CarNFT", carNftAddress, ["CarNFT", "CARNFT"]);
  await verify("MockUSDT", usdtAddress, [deployer, users]);
  await verify("VehicleSale", saleAddress, [
    seller,
    buyer,
    carNftAddress,
    1, // tokenId do NFT (ajuste se necessário)
    usdtAddress,
    totalInstallments,
    installmentAmount,
  ]);

  console.log("🎉 All verification attempts completed!");
}

main().catch((error) => {
  console.error("❌ Verification script failed:", error);
  process.exitCode = 1;
});

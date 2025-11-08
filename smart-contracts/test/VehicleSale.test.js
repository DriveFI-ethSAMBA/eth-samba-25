import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("🚗 VehicleSale system", function () {
  let deployer, seller, buyer;
  let carNFT, mockUSDT, vehicleSale;
  let tokenId;
  const totalInstallments = 3;
  const installmentAmount = ethers.parseUnits("10", 6); // 10 USDT (6 decimals)

  beforeEach(async function () {
    [deployer, seller, buyer] = await ethers.getSigners();

    // === Deploy CarNFT ===
    const CarNFT = await ethers.getContractFactory("CarNFT");
    carNFT = await CarNFT.deploy("CarNFT", "CARNFT");
    await carNFT.waitForDeployment();

    // === Mint NFT to seller ===
    const tx = await carNFT
      .connect(seller)
      .mintCar(
        seller.address,
        "",
        "VIN123456789",
        "Tesla",
        "Model S",
        2023,
        15000,
        "RENAVAM999"
      );
    const receipt = await tx.wait();

    // Pega o tokenId do evento emitido
    const iface = carNFT.interface;
    const log = receipt.logs.find((l) =>
      l.topics.includes(iface.getEvent("CarMinted").topicHash)
    );
    const parsed = iface.parseLog(log);
    tokenId = parsed.args.tokenId;

    // === Deploy MockUSDT ===
    const MockUSDT = await ethers.getContractFactory("usdtTest");
    mockUSDT = await MockUSDT.deploy(deployer.address, [seller.address, buyer.address]);
    await mockUSDT.waitForDeployment();

    // === Deploy VehicleSale ===
    const VehicleSale = await ethers.getContractFactory("VehicleSale");
    vehicleSale = await VehicleSale.deploy(
      seller.address,
      buyer.address,
      await carNFT.getAddress(),
      tokenId,
      await mockUSDT.getAddress(),
      totalInstallments,
      installmentAmount
    );
    await vehicleSale.waitForDeployment();
  });

  it("✅ Should mint a CarNFT and store metadata", async function () {
    const car = await carNFT.getCar(tokenId);
    expect(car.make).to.equal("Tesla");
    expect(car.model).to.equal("Model S");
    expect(car.year).to.equal(2023);
    expect(await carNFT.ownerOf(tokenId)).to.equal(seller.address);
  });

  it("✅ Seller should escrow NFT to VehicleSale", async function () {
    await carNFT.connect(seller).approve(await vehicleSale.getAddress(), tokenId);
    await expect(vehicleSale.connect(seller).escrowNFT())
      .to.emit(vehicleSale, "NFTDeposited")
      .withArgs(seller.address, tokenId);
    expect(await carNFT.ownerOf(tokenId)).to.equal(await vehicleSale.getAddress());
  });

  it("✅ Buyer should pay installments", async function () {
    // Escrow NFT first
    await carNFT.connect(seller).approve(await vehicleSale.getAddress(), tokenId);
    await vehicleSale.connect(seller).escrowNFT();

    // Buyer approves USDT spending
    await mockUSDT.connect(buyer).approve(await vehicleSale.getAddress(), installmentAmount);

    // Pay first installment
    await expect(vehicleSale.connect(buyer).payInstallment())
      .to.emit(vehicleSale, "InstallmentPaid")
      .withArgs(buyer.address, 1, installmentAmount);

    expect(await vehicleSale.installmentsPaid()).to.equal(1);
  });

  it("✅ Should finalize automatically when all installments paid (simulated)", async function () {
    // Escrow NFT
    await carNFT.connect(seller).approve(await vehicleSale.getAddress(), tokenId);
    await vehicleSale.connect(seller).escrowNFT();

    // Approve max spending
    await mockUSDT
      .connect(buyer)
      .approve(await vehicleSale.getAddress(), installmentAmount * BigInt(totalInstallments));

    // Pay all installments
    for (let i = 0; i < totalInstallments; i++) {
      await vehicleSale.connect(buyer).payInstallment();
    }

    // Check that checkUpkeep reports true
    const [needed] = await vehicleSale.checkUpkeep("0x");
    expect(needed).to.equal(true);

    // Perform upkeep manually
    await expect(vehicleSale.performUpkeep("0x")).to.emit(vehicleSale, "Finalized");

    // Buyer now owns NFT
    expect(await carNFT.ownerOf(tokenId)).to.equal(buyer.address);

    // Seller receives USDT
    const balanceSeller = await mockUSDT.balanceOf(seller.address);
    expect(balanceSeller).to.be.greaterThan(0);
  });

  it("🚫 Should not allow non-buyer to pay installment", async function () {
    await carNFT.connect(seller).approve(await vehicleSale.getAddress(), tokenId);
    await vehicleSale.connect(seller).escrowNFT();
    await mockUSDT.connect(buyer).approve(await vehicleSale.getAddress(), installmentAmount);

    await expect(vehicleSale.connect(seller).payInstallment()).to.be.revertedWith("Only buyer");
  });

  it("🚫 Should prevent re-finalization after completion", async function () {
    await carNFT.connect(seller).approve(await vehicleSale.getAddress(), tokenId);
    await vehicleSale.connect(seller).escrowNFT();
    await mockUSDT
      .connect(buyer)
      .approve(await vehicleSale.getAddress(), installmentAmount * BigInt(totalInstallments));

    for (let i = 0; i < totalInstallments; i++) {
      await vehicleSale.connect(buyer).payInstallment();
    }

    await vehicleSale.performUpkeep("0x");
    await expect(vehicleSale.performUpkeep("0x")).to.not.emit(vehicleSale, "Finalized");
  });
});

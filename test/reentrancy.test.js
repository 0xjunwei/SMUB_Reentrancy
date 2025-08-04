const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TheBank reentrancy attack demo", function () {
  let deployer, seeder, attackerEOA;
  let bank, attacker;

  beforeEach(async () => {
    [deployer, seeder, attackerEOA] = await ethers.getSigners();

    // Deploy the vulnerable bank
    const Bank = await ethers.getContractFactory("TheBank");
    bank = await Bank.deploy();
    await bank.waitForDeployment();

    // Seed bank with 5 ETH from seeder
    await bank.connect(seeder).deposit({ value: ethers.parseEther("5") });

    // Deploy attacker
    const Attacker = await ethers.getContractFactory("TheAttacker");
    attacker = await Attacker.connect(attackerEOA).deploy(
      await bank.getAddress()
    );
    await attacker.waitForDeployment();
  });

  it("baseline: seeder can withdraw only their own funds (no reentrancy)", async () => {
    // Seeder deposited 5 ETH, withdraws
    await bank.connect(seeder).withdrawal();
    const remaining = await ethers.provider.getBalance(await bank.getAddress());
    expect(remaining).to.equal(0n);
  });

  it("attacker drains all funds via reentrancy (pre-seeded + their deposit)", async () => {
    // Attack with 1 ETH seed
    await attacker
      .connect(attackerEOA)
      .attack({ value: ethers.parseEther("1") });

    // Bank should be drained (final balance < 1 ETH, expected 0)
    const bankBal = await ethers.provider.getBalance(await bank.getAddress());
    console.log("Post-attack bank balance:", ethers.formatEther(bankBal));
    expect(bankBal).to.equal(0n);

    // Attacker contract should hold the seed (1 ETH) + drained pre-seed (5 ETH) = ~6 ETH
    const attackerBal = await attacker.getBalances();
    console.log("Attacker contract balance:", ethers.formatEther(attackerBal));
    expect(attackerBal).to.equal(ethers.parseEther("6"));
  });
});

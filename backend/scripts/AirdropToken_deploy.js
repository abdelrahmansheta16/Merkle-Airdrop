const hre = require("hardhat");

async function main() {
	const Contract = await hre.ethers.getContractFactory("AirdropToken");
	const contract = await Contract.deploy();

	await contract.deployed();

	console.log("AirdropToken deployed to:", contract.address);

	const MerkleContract = await hre.ethers.getContractFactory("AirdropMerkle");
	const merkleContract = await MerkleContract.deploy(contract.address);

	await merkleContract.deployed();

	console.log("MerkleAirdrop deployed to:", merkleContract.address);

}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
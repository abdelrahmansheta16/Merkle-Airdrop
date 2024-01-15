// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./AirdropToken.sol";

contract AirdropMerkle is Ownable {
    // ERC20 token to be distributed
    AirdropToken public token;

    // Merkle root of the airdrop distribution
    bytes32 public merkleRoot;

    // Mapping to track claimed addresses
    mapping(address => bool) public claimed;

    // Event emitted when a user claims tokens
    event Claim(address indexed account, uint256 amount);

    // Event emitted when the merkle root is updated
    event MerkleRootUpdated(bytes32 newMerkleRoot);

    constructor(address _token) {
        token = AirdropToken(_token);
    }

    // Function to update the merkle root (only owner)
    function updateMerkleRoot(bytes32 newMerkleRoot) external onlyOwner {
        merkleRoot = newMerkleRoot;
        emit MerkleRootUpdated(newMerkleRoot);
    }

    // Function to claim tokens using merkle proof
    function claim(bytes32[] calldata proof,bytes32 leaf) external {
        require(!claimed[msg.sender], "Already claimed");
        require(leaf == keccak256(abi.encodePacked(msg.sender)), "Only token claimer can call this function");

        // Verify the merkle proof
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");

        // Mark the user as claimed
        claimed[msg.sender] = true;

        // Transfer tokens to the user
        token.transfer(msg.sender, 1*10**18);

        // Emit the claim event
        emit Claim(msg.sender, 1*10**18);
    }
}

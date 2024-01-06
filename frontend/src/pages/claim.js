
import { Contract, ethers } from 'ethers';
import React, { useState } from 'react';
import AirdropMerkle from '../../artifacts/contracts/MerkleAirdrop.sol/AirdropMerkle.json';
import { useAccount } from 'wagmi';
import axios from 'axios';

const AirdropClaim = () => {
    const [address, setAddress] = useState('')
    const { address: account, isConnected } = useAccount();
    const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_ALCHEMY_URL);
    console.log(provider);
    const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY, provider);
    console.log(wallet);
    const signer = wallet.connect(provider);
    console.log(signer);

    const handleClaim = async () => {
        console.log(account);
        const response = await axios.get(`http://localhost:5000/proof/${account}/`);
        const hexProof = response.data.hexProof;
        console.log(hexProof)
        const contract = new Contract("0x747c58328c1c9b6c6f6e29c12411878fe6EAED77", AirdropMerkle.abi, signer);
        console.log(contract);
        const tx = await contract.claim(hexProof,ethers.utils.parseEther('1'));
    };

    return (
        <main className='flex justify-center items-center h-screen'>
            <div className="flex flex-col justify-evenly h-full container w-1/2 mx-auto">
                <h1 className="flex justify-center text-7xl font-semibold mb-6">Airdrop Claim</h1>
                <input
                    type="text"
                    placeholder="Your Ethereum address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="border rounded px-4 py-2 mb-4"
                />
                <div className='flex justify-center'>
                    <button
                        onClick={handleClaim}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        <p className='text-5xl'>
                            Claim Tokens
                        </p>
                    </button>
                </div>
            </div>
        </main>

    );
};

export default AirdropClaim;

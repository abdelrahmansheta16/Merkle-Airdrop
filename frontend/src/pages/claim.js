
import { Contract, ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import { useAccount, useSigner } from 'wagmi';
import AirdropMerkle from '../../artifacts/contracts/MerkleAirdrop.sol/AirdropMerkle.json'
import axios from 'axios';
require('dotenv').config()


const AirdropClaim = () => {
    const [address, setAddress] = useState('')
    const [userCount, setUserCount] = useState(0);
    const [signer, setSigner] = useState();
    const { address: account, isConnected } = useAccount();
    const [user, setUser] = useState({});
    const maxUsers = process.env.NEXT_PUBLIC_MAX_USERS;
    const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, AirdropMerkle.abi, signer);


    useEffect(() => {
        const initFunction = async () => {
            const userCount = await axios.get(`http://localhost:5000/userCount/`);
            console.log(user);
            setUserCount(userCount.data.userCount);
            try {
                // Check if MetaMask is installed
                if (typeof window.ethereum !== 'undefined') {
                    // Request account access if needed
                    await window.ethereum.request({ method: 'eth_requestAccounts' });

                    // Create a Web3Provider from MetaMask
                    const provider = new ethers.providers.Web3Provider(window.ethereum);

                    // Get the signer associated with the user's MetaMask account
                    const signer = provider.getSigner();
                    setSigner(signer);
                    // Get the user's Ethereum address
                    const address = await signer.getAddress();

                    console.log('Connected to MetaMask');
                    console.log('User Address:', address);

                    // Set the user's address in the component state
                    setUserAddress(address);
                } else {
                    console.error('MetaMask not installed');
                }
            } catch (error) {
                console.error('Error connecting to MetaMask:', error.message);
            }
        }
        initFunction();
    }, [maxUsers]);

    const handleClaim = async () => {
        try {
            console.log(account);
            const response = await axios.get(`http://localhost:5000/proof/${account}/`);
            console.log(response.data);
            const { hexProof, claimingAddress } = response.data;

            let _tx = await contract.connect(signer).claim(hexProof, claimingAddress);
            console.log(_tx)
            console.log("tx hash: ", _tx?.hash);
            let _receipt = await _tx.wait();
            alert('You have successfully claimed the tokens. Here is the transaction reciept: \n', _receipt);
            console.log("tx receipt: ", _receipt);
        } catch (e) {
            alert(e);
        }
    };

    return (
        <main className='flex justify-center items-center h-screen'>
            <div className="flex flex-col justify-evenly h-full container w-1/2 mx-auto">
                {userCount <= parseInt(maxUsers) ? <><h1 className="flex justify-center text-7xl font-semibold mb-6">Airdrop Claim</h1>
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
                    </div></> : <h1 className="flex justify-center text-7xl font-semibold mb-6">Airdrop Claim Hasn't Started Yet</h1>}

            </div>
        </main>

    );
};

export default AirdropClaim;

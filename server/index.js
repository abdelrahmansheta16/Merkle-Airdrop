const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const AirdropMerkle = require('./artifacts/contracts/MerkleAirdrop.sol/AirdropMerkle.json');
const { MerkleTree } = require('merkletreejs');
const { Server } = require('socket.io');
const { createServer } = require('node:http');
const ethers = require('ethers');
const keccak256 = require('keccak256');
var cors = require('cors');
require('dotenv').config()


const app = express();
app.use(cors())

const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const maxUsers = process.env.MAX_USERS;
const mongodbUrl = process.env.MONGODB_URL;
const telegramToken = process.env.TELEGRAM_TOKEN;

// Connect to Ethereum using Infura or any other Ethereum provider
const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_URL);

// Your wallet's private key
const privateKey = process.env.PRIVATE_KEY;

// Connect to the Ethereum network with your wallet
const wallet = new ethers.Wallet(privateKey, provider);

const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, AirdropMerkle.abi, wallet);


// Connect to MongoDB
mongoose.connect(mongodbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
// Define a user schema
const userSchema = new mongoose.Schema({
    telegramUsername: String,
    firstName: String,
    lastName: String,
    walletAddress: String,
    hasJoinedChat: Boolean
});

const User = mongoose.model('User', userSchema);

// Handle endpoint to get user by wallet address
app.get('/userCount', async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.status(200).json({ userCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Handle endpoint to get user by wallet address
app.get('/user/:account', async (req, res) => {
    try {
        const { account } = req.params;
        const user = await User.findOne({ walletAddress: account });
        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Handle endpoint to get user by wallet address
app.get('/user/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        // Find the user in the database based on wallet address
        const user = await User.findOne({ walletAddress });

        if (user) {
            res.status(200).json({ user });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Handle endpoint to get user by wallet address
app.get('/proof/:walletAddress', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        console.log(walletAddress);

        // Extract wallet addresses from the list of users
        const walletAddressesArray = await User.find({}, 'walletAddress -_id');

        // Update the whitelistAddresses array
        const whitelistAddresses = walletAddressesArray.map(item => item.walletAddress.toLowerCase());
        const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
        const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
        const buf2hex = x => '0x' + x.toString('hex');
        const rootHash = buf2hex(merkleTree.getRoot());
        console.log('Whitelist Merkle Tree\n', merkleTree.toString());
        console.log("Root Hash: ", rootHash);
        const claimingAddress = buf2hex(keccak256(walletAddress))
        console.log(claimingAddress)
        const hexProof = merkleTree.getProof(keccak256(walletAddress)).map(x => buf2hex(x.data));
        console.log("hexProof: ", hexProof);
        console.log(merkleTree.verify(hexProof, claimingAddress, rootHash));

        if (hexProof) {
            res.status(200).json({ hexProof, claimingAddress });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Handle registration endpoint
app.post('/register', async (req, res) => {
    try {
        const { telegramUsername, firstName, lastName, walletAddress } = req.body;

        // Save user information to MongoDB
        const user = new User({
            telegramUsername,
            firstName,
            lastName,
            walletAddress,
            hasJoinedChat: true
        });

        await user.save();

        // Emit a custom event indicating a new user has been added along with user count
        console.log('Adding new user');
        const userCount = await User.countDocuments();
        if (userCount == maxUsers) {

            const walletAddressesArray = await User.find({}, 'walletAddress -_id');

            // Update the whitelistAddresses array
            const whitelistAddresses = walletAddressesArray.map(item => item.walletAddress.toLowerCase());
            const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
            const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
            const buf2hex = x => '0x' + x.toString('hex');
            const rootHash = buf2hex(merkleTree.getRoot());
            console.log('Whitelist Merkle Tree\n', merkleTree.toString());
            console.log("Root Hash: ", rootHash);

            let _tx = await contract.connect(wallet).updateMerkleRoot(rootHash);
            console.log("tx hash: ", _tx?.hash);
            let _receipt = await _tx.wait();
            console.log("tx receipt: ", _receipt);
        }
        // Emit the user count to all connected clients
        io.emit('userCountUpdate', { userCount });

        res.status(200).json({ message: 'Registration successful!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(telegramToken, { polling: true });

const registrationSteps = {
    INIT: 'init',
    REQUEST_WALLET: 'request_wallet',
    JOIN_CHAT: 'join_chat',
};

// Map to store user registration progress
const registrationProgress = new Map();

// Register command handler
bot.onText(/\/request/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userCount = await User.countDocuments();
    console.log(userCount);
    // Check if the user is already in the registration process
    const currentStep = registrationProgress.get(userId);
    if (userCount > maxUsers) {
        console.log(userCount);
        console.log(maxUsers);
        bot.sendMessage(chatId, 'Airdrop registration is closed');
    } else {
        if (!currentStep || currentStep === registrationSteps.INIT) {
            // Start the registration process
            registrationProgress.set(userId, registrationSteps.REQUEST_WALLET);
            bot.sendMessage(chatId, 'To proceed, please provide your wallet address.');
        } else {
            // User is already in the registration process
            bot.sendMessage(chatId, 'You are already in the registration process. Please provide your wallet address.');
        }
    }
});

// Handle incoming messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const message = msg.text;
    const userCount = await User.countDocuments();

    console.log(message);
    console.log(userCount);
    console.log(maxUsers);

    // Check the user's current registration step
    const currentStep = registrationProgress.get(userId);

    if (message && currentStep === registrationSteps.REQUEST_WALLET && message.length == 42) {
        // Check if a user with the same walletAddress already exists
        const existingUser = await User.findOne({ message });

        if (existingUser) {
            bot.sendMessage(chatId, 'Wallet Address already registered');
        } else {
            // Send an invitation link to the user to join the group
            bot.sendMessage(chatId, 'Click the following link to join the group: https://t.me/+prVaQ9BzNewyMjQ8');
            // Handle new chat members
            bot.on('new_chat_members', async (msg) => {
                // Check if the user has completed the registration process
                const currentStep = registrationProgress.get(userId);

                if (currentStep === registrationSteps.JOIN_CHAT) {
                    bot.sendMessage(chatId, 'Welcome to the group!');
                }

                const walletAddress = message;
                console.log("hel: ", walletAddress);
                // Continue with the registration process
                const registrationData = {
                    userId,
                    telegramUsername: msg.from.username,
                    firstName: msg.from.first_name,
                    lastName: msg.from.last_name,
                    walletAddress,
                };
                // Send registration data to your Node.js server
                try {
                    const response = await axios.post('http://localhost:5000/register', registrationData);
                    bot.sendMessage(chatId, response.data.message);
                    // Update the registration progress
                    registrationProgress.set(userId, registrationSteps.JOIN_CHAT);
                } catch (error) {
                    console.error('Error during registration:', error.message);
                    bot.sendMessage(chatId, 'Error during registration. Please try again.');
                }
            });
        }
    } else if (currentStep === registrationSteps.JOIN_CHAT) {
        // User is already registered and joined the chat
        bot.sendMessage(chatId, 'You are already registered and have joined the chat.');
    } else if (currentStep === registrationSteps.REQUEST_WALLET) {
        // User is already registered and joined the chat
        bot.sendMessage(chatId, 'You are already in the registration process. Please provide your wallet address.');
    }
    else {
        if (message != "/request") {
            if (userCount > maxUsers) {
                console.log('hello')
                bot.sendMessage(chatId, 'Airdrop registration is closed');
            } else {
                // User is not in any registration process
                bot.sendMessage(chatId, 'You have not started the registration process. Use /request to start.');
            }
        }
    }
});


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});



// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const { MerkleTree } = require('merkletreejs');
const { ethers } = require('ethers');
const keccak256 = require('keccak256');
var cors = require('cors');

const app = express();
app.use(cors())

const PORT = process.env.PORT || 5000;

let whitelistAddresses = [
    '0X5B38DA6A701C568545DCFCB03FCB875F56BEDDC4'.toLowerCase(),
    '0X5A641E5FB72A2FD9137312E7694D42996D689D99'.toLowerCase()
];
// The leaves, merkleTree, and rootHas are all PRE-DETERMINED prior to whitelist claim
let leafNodes;
let merkleTree;

// 4. Get root hash of the `merkleeTree` in hexadecimal format (0x)
// Print out the Entire Merkle Tree.
let rootHash;

app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb+srv://abdelrahmansheta16:bZE5hq8aOYcLGcrI@cluster0.kvyq7im.mongodb.net/', {
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
        whitelistAddresses.push(walletAddress.toLowerCase());
        console.log(whitelistAddresses);
        const leafNodes = whitelistAddresses.map(addr => Buffer.from(ethers.utils.solidityKeccak256(["address"], [addr]).slice(2), "hex"));
        const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
        const rootHash = merkleTree.getHexRoot();
        console.log('Whitelist Merkle Tree\n', merkleTree.toString());
        console.log("Root Hash: ", rootHash);
        const claimingAddress = Buffer.from(ethers.utils.solidityKeccak256(["address"], [whitelistAddresses[2].toLowerCase()]).slice(2), "hex");
        const hexProof = merkleTree.getHexProof(claimingAddress);
        console.log("hexProof: ", hexProof);
        console.log(merkleTree.verify(hexProof, claimingAddress, rootHash));

        if (hexProof) {
            res.status(200).json({ hexProof });
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

        res.status(200).json({ message: 'Registration successful!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Your Telegram bot token
const token = '6342356196:AAGn2jvDu4fkE8JR2ejtHiOxOlqgEVVl0ig';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const registrationSteps = {
    INIT: 'init',
    REQUEST_WALLET: 'request_wallet',
    JOIN_CHAT: 'join_chat',
};

// Map to store user registration progress
const registrationProgress = new Map();

// Register command handler
bot.onText(/\/request/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Check if the user is already in the registration process
    const currentStep = registrationProgress.get(userId);
    if (whitelistAddresses.length > 2) {
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
    console.log(message);

    // Check the user's current registration step
    const currentStep = registrationProgress.get(userId);

    if (message && currentStep === registrationSteps.REQUEST_WALLET && message.length == 42) {
        const walletAddress = message;
        if (whitelistAddresses.includes(message)) {
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
                    walletAddress: msg.text,
                };

                console.log(walletAddress);
                whitelistAddresses.push(walletAddress);
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
            if (whitelistAddresses.length > 2) {
                bot.sendMessage(chatId, 'Airdrop registration is closed');
            } else {
                // User is not in any registration process
                bot.sendMessage(chatId, 'You have not started the registration process. Use /request to start.');
            }
        }
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

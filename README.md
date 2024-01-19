# Web3 Airdrop Project

## Overview

Welcome to our Web3 Airdrop Project! This repository houses the codebase for a decentralized airdrop platform where users can register and claim tokens seamlessly. The project leverages Web3 technologies, utilizing Telegram, Node.js, MongoDB, and smart contracts to facilitate the airdrop process.

## Features

### 1. Airdrop Registration via Telegram BOT

Users can easily register for airdrops through a Telegram BOT. The registration process involves joining the Telegram chat box, following Twitter, or retweeting as specified conditions. Once the user completes the registration steps, the Telegram BOT communicates with the Node.js server to save the user's information to a MongoDB database.

### 2. Airdrop Claim Process

After closing the airdrop registration phase, users can proceed to claim their tokens on the dedicated airdrop page. The server calculates and returns a Merkle Proof based on users' addresses. Users then sign the transaction, calling a smart contract to initiate the token claim process. If users have successfully registered before, they will receive the allocated tokens upon completing the transaction.

## Getting Started

### Prerequisites

Before running the project, ensure you have the following set up:

- Node.js installed
- MongoDB installed and running
- Metamask wallet with a funded account for private key

### Backend Configuration

1. **Backend Directory Setup:**

    ```bash
    cd backend
    ```

2. **Create a `.env` file and add the following variables:**

    ```env
    ALCHEMY_API_KEY=<alchemy_rpc_node_api_key_for_sepolia_network>
    ETHERSCAN_API_KEY=<etherscan_api_key>
    PRIVATE_KEY=<your_metamask_private_key>
    ```

3. **Run npm install:**

    ```bash
    npm install
    ```

4. **Deploy the smart contract:**

    ```bash
    npx hardhat run --network ETH_SEPOLIA scripts/AirdropToken_deploy.js
    ```

5. **Go to the `backend/server` directory:**

    ```bash
    cd server
    ```

6. **Create a `.env` file and add the following variables:**

    ```env
    ALCHEMY_URL=<alchemy_rpc_node_url_for_sepolia_network>
    PRIVATE_KEY=<your_metamask_private_key>
    CONTRACT_ADDRESS=<MerkleAirdrop_smart_contract_address_that_you_have_deployed>
    MAX_USERS=<max_number_of_users_to_register>
    MONGODB_URL=<your_mongodb_url_for_the_database>
    TELEGRAM_TOKEN=<your_telegram_token>
    ```

7. **Run the server using nodemon:**

    ```bash
    nodemon index.js
    ```

### Frontend Configuration

1. **Go to the `frontend` directory:**

    ```bash
    cd frontend
    ```

2. **Create a `.env` file and add the following variables:**

    ```env
    ALCHEMY_API_KEY=<alchemy_rpc_node_api_key_for_sepolia_network>
    ALCHEMY_NETWORK=ETH_SEPOLIA
    NEXT_PUBLIC_ALCHEMY_NETWORK=ETH_SEPOLIA
    NEXT_PUBLIC_DEFAULT_CHAIN=sepolia
    NEXT_PUBLIC_MAX_USERS=<max_number_of_users_to_register>
    NEXT_PUBLIC_CONTRACT_ADDRESS=<MerkleAirdrop_smart_contract_address_that_you_have_deployed>
    NEXT_PUBLIC_ALCHEMY_URL=<alchemy_rpc_node_url_for_sepolia_network>
    NEXT_PUBLIC_PRIVATE_KEY=<your_metamask_private_key>
    ```

3. **Run npm install:**

    ```bash
    npm install
    ```

4. **Run the frontend development server:**

    ```bash
    npm run dev
    ```

Feel free to explore, contribute, and enhance the capabilities of our Web3 Airdrop Project! If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request. Happy coding!

## Technologies Used

- Web3.js
- Telegram BOT API
- Node.js
- MongoDB
- Smart Contracts (Solidity)

## Contributors

- [Abdelrahman Sheta](https://github.com/abdelrahmansheta16)

## License

This project is licensed under the [MIT License](LICENSE).

Feel free to explore, contribute, and enhance the capabilities of our Web3 Airdrop Project! If you encounter any issues or have suggestions for improvements, please open an issue or submit a pull request. Happy coding!

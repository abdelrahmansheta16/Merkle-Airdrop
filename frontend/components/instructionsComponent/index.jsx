// AirdropRegistration.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useAccount } from 'wagmi';
require('dotenv').config()



const AirdropRegistration = () => {
  const [userCount, setUserCount] = useState(0);
  const [user, setUser] = useState({});
  const { address: account, isConnected } = useAccount();
  const maxUsers = process.env.NEXT_PUBLIC_MAX_USERS;
  const telegramURL = process.env.NEXT_PUBLIC_TELEGRAM_URL;
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL;
  console.log(user);

  useEffect(() => {
    const initFunction = async () => {
      const userCount = await axios.get(`${serverURL}/userCount/`);
      const user = await axios.get(`${serverURL}/user/${account}`);
      setUser(user.data.user);
      setUserCount(userCount.data.userCount);

      // Connect to the server using WebSocket
      const socket = io(serverURL);

      // Listen for updates on the number of users
      socket.on('userCountUpdate', (data) => {
        setUserCount(data.userCount);
      });

      // Cleanup the socket connection on component unmount
      return () => {
        socket.disconnect();
      };
    }
    initFunction();
  }, []);

  // Function to handle user registration
  const handleRegistration = () => {
    // Check the condition to stop adding new users
    if (userCount < maxUsers) {
      window.open(telegramURL, '_blank');
    } else {
      alert('Registration limit reached. Cannot add more users.');
    }
  };

  return (
    <>
      {user ? <div>
        Hi {user.firstName}, You're already registered
      </div> : userCount > maxUsers ? <div>Registration Closed</div> : <div className="container mx-auto mt-10">
        <h1 className="text-3xl font-semibold mb-6">Airdrop Registration</h1>
        <h1 className="text-2xl mb-6">User Count: {userCount}</h1>
        <button
          onClick={handleRegistration}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Register
        </button>
      </div>}
    </>

  );
};

export default AirdropRegistration;

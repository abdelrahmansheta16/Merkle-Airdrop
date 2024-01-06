// AirdropRegistration.js

import React, { useState } from 'react';

const AirdropRegistration = () => {
    const [telegram, setTelegram] = useState('');
    const [twitter, setTwitter] = useState('');

    const handleRegistration = () => {
        window.open('https://t.me/abdelrahman050_bot', '_blank');
    };

    return (
        <div className="container mx-auto mt-10">
            <h1 className="text-3xl font-semibold mb-6">Airdrop Registration</h1>
            <input
                type="text"
                placeholder="Telegram username"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                className="border rounded px-4 py-2 mb-4"
            />
            <input
                type="text"
                placeholder="Twitter username"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                className="border rounded px-4 py-2 mb-4"
            />
            <button
                onClick={handleRegistration}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
                Register
            </button>
        </div>
    );
};

export default AirdropRegistration;

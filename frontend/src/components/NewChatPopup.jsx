import React, { useState } from "react";
import axios from "axios";
import {
  importPublicKey,
  encryptMessage,
  arrayBufferToBase64,
} from "../crypto";
import { sendMessage } from "../api/messages";

const NewChatPopup = ({ accessToken, onClose, publicKeyPara, userIdSelf }) => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  const startChat = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/users/user_id/${username}`
      );
      const userId = response.data.user_id;
      const public_key = response.data.public_key;

      console.log("Public key of user:", public_key);

      if (userId) {
        console.log("User ID found:", userId);
        console.log("Message:", message);
        console.log("Access token:", accessToken);
        await sendMessage(accessToken, message, userId);

        // const publicKeySelf = await importPublicKey(publicKeyPara);
        // const encryptedMessageSelf = await encryptMessage(
        //   publicKeySelf,
        //   message
        // );
        // const encryptedMessageSelfBase64 =
        //   arrayBufferToBase64(encryptedMessageSelf);

        // console.log(
        //   accessToken,
        //   encryptedMessageSelfBase64,
        //   userId,
        //   userIdSelf
        // );

        // await sendMessage(
        //   accessToken,
        //   encryptedMessageSelfBase64,
        //   userId,
        //   userIdSelf
        // );

        // await axios.post(
        //   "http://localhost:8000/messages/send_message",
        //   {
        //     content: message,
        //     receiver_id: userId,
        //     selectedChat: userId,
        //   },
        //   {
        //     headers: {
        //       Authorization: `Bearer ${accessToken}`,
        //     },
        //   }
        // );
        console.log("Chat started and message sent");
      } else {
        console.error("User ID not found");
      }
    } catch (error) {
      console.error("Error in starting chat:", error);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-1/3">
        <h2 className="text-xl mb-4 text-gray-700">Start New Chat</h2>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              startChat();
            }
          }}
        />
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              startChat();
            }
          }}
        />
        <button
          className="mr-2 p-2 bg-green-400 bg-opacity-20 text-black rounded-lg shadow-md hover:shadow-lg transition-shadow"
          onClick={startChat}
        >
          Start Chat
        </button>
        <button
          className="p-2 bg-red-400 bg-opacity-20 text-black rounded-lg shadow-md hover:shadow-lg transition-shadow"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default NewChatPopup;

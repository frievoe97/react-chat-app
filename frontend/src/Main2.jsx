import React, { useState, useEffect } from "react";
import useChat from "./hooks/useChat";
import {
  organizeChatsByUserId,
  formatTimestamp,
  getFullnamesFromChat,
} from "./utils";
import NewChatPopup from "./components/NewChatPopup";
import NewGroupPopup from "./components/NewGroupPopup";
import LeaveGroupPopup from "./components/LeaveGroupPopup";
import AddGroupMemberPopup from "./components/AddGroupMemberPopup";
import { sendMessage, markMessagesAsRead } from "./api/messages";
import { importPublicKey, encryptMessage, arrayBufferToBase64 } from "./crypto";

const Main = ({ accessToken, userId, publicKeyPara, privateKeyPara }) => {
  const {
    userData,
    selectedChatId,
    setSelectedChatId,
    newMessage,
    setNewMessage,
    showNewChatPopup,
    setShowNewChatPopup,
    showNewGroupPopup,
    setShowNewGroupPopup,
    showLeaveGroup,
    setShowLeaveGroup,
    showAddGroupMember,
    setShowAddGroupMember,
    handleTyping,
  } = useChat(accessToken, userId);

  const [chats, setChats] = useState([]);
  // const [messages, setMessages] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    if (userData && privateKeyPara) {
      const fetchChats = async () => {
        try {
          setLoadingChats(true); // Beginne das Laden
          const organizedChats = await organizeChatsByUserId(
            userData,
            userId,
            privateKeyPara
          );
          setChats(organizedChats);
          console.log("Chats erfolgreich organisiert:", organizedChats);
        } catch (error) {
          console.error("Fehler beim Organisieren der Chats:", error);
        } finally {
          setLoadingChats(false); // Ladevorgang beendet
        }
      };

      fetchChats();
      console.log(
        "User data or private key changed:",
        userData,
        privateKeyPara
      );
    }
  }, [userData, userId, privateKeyPara]);

  useEffect(() => {
    if (!loadingChats) {
      setChats(chats);
      selectChat(selectedChatId);
      const selectedChat = chats.find((chat) => chat.chatId === selectedChatId);
      if (selectedChat) {
        console.log("Selected chat changed:", selectedChat);
        // setMessages(selectedChat.messages);
      }
    }
  }, [chats, loadingChats]);

  useEffect(() => {
    if (!loadingChats) {
      console.log("Chats changed:", chats);
    }
  }, [chats, loadingChats]);

  const handleSendMessage = async (receiverId) => {
    const message = newMessage;
    const selectedChat = chats.find((chat) => chat.chatId === selectedChatId); // Füge das hier hinzu

    const publicKey = await importPublicKey(selectedChat.publicKey);
    const encryptedMessage = await encryptMessage(publicKey, message);
    const encryptedMessageBase64 = arrayBufferToBase64(encryptedMessage);

    try {
      if (selectedChat.isGroupMessage) {
        await sendMessage(accessToken, encryptedMessageBase64, receiverId);
      } else {
        await sendMessage(
          accessToken,
          encryptedMessageBase64,
          receiverId,
          selectedChat.withUser.userId
        );

        const publicKeySelf = await importPublicKey(publicKeyPara);
        const encryptedMessageSelf = await encryptMessage(
          publicKeySelf,
          message
        );
        const encryptedMessageSelfBase64 =
          arrayBufferToBase64(encryptedMessageSelf);

        await sendMessage(
          accessToken,
          encryptedMessageSelfBase64,
          receiverId,
          userId
        );
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleMarkMessagesAsRead = async (chat) => {
    if (chat && chat.messages) {
      const sentMessageIds = chat.messages
        .filter((message) => message.status === "sent")
        .map((message) => message.id);

      try {
        await markMessagesAsRead(accessToken, userId, sentMessageIds);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }
  };

  const chatIds = chats.map((chat) => chat.chatId);

  const selectChat = async (chatId) => {
    setSelectedChatId(chatId);
    const chat = chats.find((chat) => chat.chatId === chatId);
    setSelectedChat(chat);
    await handleMarkMessagesAsRead(chat); // Mark messages as read for selected chat
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  console.log("User data:", userData);
  console.log("Chats:", chats);
  // console.log("Messages:", messages);
  console.log("Selected Chat ID:", selectedChatId);
  console.log("Chat IDs:", chatIds);

  return (
    <div className="flex flex-col h-screen">
      {/* Header with menu button */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 shadow-md ">
        <h1 className="text-2xl font-bold text-gray-800">Chat Application</h1>
        <div>
          <button
            className="p-2 bg-gray-200 rounded-full focus:outline-none"
            onClick={() => setShowMenu(!showMenu)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-4 mt-2 bg-white border rounded-lg shadow-lg w-48 py-2">
              <p className="px-4 py-2 text-gray-700">
                {
                  userData.interacting_users.find((u) => u.id === userId)
                    ?.fullname
                }
              </p>
              <hr className="my-1" />
              <button className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100">
                Settings
              </button>
              <button className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-100">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-1/4 border-r p-4 relative bg-white shadow-lg">
          <h2 className="text-xl mb-4 text-gray-700">Chats</h2>
          <ul>
            {chatIds.map((chatId) => {
              const chat = chats.find((c) => c.chatId === chatId);
              const chatName = chat.groupName
                ? chat.groupName
                : chat.withUser
                ? chat.withUser.fullname
                : "Unknown";
              return (
                <li
                  key={chatId}
                  className={`p-2 cursor-pointer flex flex-row justify-between rounded-lg ${
                    selectedChatId === chatId
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => selectChat(chatId)}
                >
                  <div className="text-gray-800">{chatName}</div>
                  {chat.numberOfUnreadMessages > 0 && (
                    <div className="bg-blue-400 rounded-full text-white w-6 h-6 flex items-center justify-center">
                      {chat.numberOfUnreadMessages}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="absolute bottom-4 left-4">
            <button
              className="mr-2 p-2 bg-green-400 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              onClick={() => setShowNewChatPopup(true)}
            >
              New Chat
            </button>
            <button
              className="p-2 bg-purple-400 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              onClick={() => setShowNewGroupPopup(true)}
            >
              New Group
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="w-3/4 p-4 h-full">
          {selectedChatId ? (
            <div className="h-full flex flex-col">
              <div className="flex flex-row justify-between items-center mb-4">
                {selectedChat && (
                  <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {selectedChat.groupName || selectedChat.withUser.fullname}
                    </h2>
                    <p className="text-gray-600">
                      {getFullnamesFromChat(selectedChat).join(", ")}
                    </p>
                  </div>
                )}

                {selectedChat?.isGroupMessage && (
                  <div>
                    <button
                      className="mr-2 p-2 bg-red-400 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      onClick={() => setShowLeaveGroup(true)}
                    >
                      Leave Group
                    </button>
                    <button
                      className="p-2 bg-blue-400 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      onClick={() => setShowAddGroupMember(true)}
                    >
                      Add Member
                    </button>
                  </div>
                )}
              </div>

              <div className="border rounded-lg border-gray-300 p-2 overflow-y-auto flex-1 bg-gray-50 shadow-inner flex flex-col-reverse">
                {selectedChat?.members?.some(
                  (member) => member.userId !== userId && member.isTyping
                )
                  ? selectedChat.members.map((member, index) =>
                      member.userId !== userId && member.isTyping ? (
                        <div key={index} className="mb-2">
                          <span className="text-sm text-gray-500">
                            {member.fullname}
                          </span>
                          <br />
                          <span className="inline-block p-2 rounded-lg bg-gray-50">
                            {member.isTyping && "types..."}
                          </span>
                        </div>
                      ) : null
                    )
                  : null}

                {/* Message list */}
                {selectedChat?.messages?.length > 0
                  ? selectedChat.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`mb-2 ${
                          message.sender.userId === userId ? "text-right" : ""
                        }`}
                      >
                        <span className="text-sm text-gray-500">
                          {message.sender.fullname}
                          <span className="ml-2">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </span>
                        <br />
                        <span
                          className={`inline-block p-2 rounded-lg ${
                            message.sender.userId === userId
                              ? "bg-blue-50"
                              : "bg-green-50"
                          } shadow-sm`}
                        >
                          {message.content}
                        </span>
                      </div>
                    ))
                  : null}

                {/* Check if both members and messages are empty */}
                {!selectedChat?.members?.some(
                  (member) => member.userId !== userId && member.isTyping
                ) &&
                  !selectedChat?.messages?.length && (
                    <p className="text-gray-500">No messages yet</p>
                  )}
              </div>

              <div className="flex mt-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping(selectedChatId); // Notify typing status
                  }}
                  placeholder="Type your message..."
                  className="p-2 border rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage(selectedChatId);
                    }
                  }}
                />
                <button
                  className="ml-2 p-2 bg-blue-400 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  onClick={() => handleSendMessage(selectedChatId)}
                >
                  Send
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Select a chat to start messaging</p>
          )}
        </div>

        {/* Popups */}
        {showNewChatPopup && (
          <NewChatPopup
            accessToken={accessToken}
            onClose={() => setShowNewChatPopup(false)}
            publicKeyPara={publicKeyPara}
            userIdSelf={userId}
          />
        )}
        {showNewGroupPopup && (
          <NewGroupPopup
            accessToken={accessToken}
            onClose={() => setShowNewGroupPopup(false)}
          />
        )}
        {showLeaveGroup && (
          <LeaveGroupPopup
            accessToken={accessToken}
            selectedChatId={selectedChatId}
            onClose={() => setShowLeaveGroup(false)}
          />
        )}
        {showAddGroupMember && (
          <AddGroupMemberPopup
            accessToken={accessToken}
            selectedChatId={selectedChatId}
            onClose={() => setShowAddGroupMember(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Main;

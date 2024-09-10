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

const Main = ({
  accessToken = null,
  userId = null,
  publicKeyPara,
  privateKeyPara = null,
  logout,
}) => {
  const {
    userData,
    setUserData,
    handleTyping,
    selectedChatId,
    setSelectedChatId,
  } = useChat(accessToken, userId);

  const [chats, setChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [chatIds, setChatIds] = useState([]);
  // const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showNewChatPopup, setShowNewChatPopup] = useState(false);
  const [showNewGroupPopup, setShowNewGroupPopup] = useState(false);
  const [showLeaveGroup, setShowLeaveGroup] = useState(false);
  const [showAddGroupMember, setShowAddGroupMember] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  // Dummy Methods
  const selectChat = async (chatId) => {
    // console.log("selectChat aufgerufen mit chatId:", chatId);
    const selected = chats.find((chat) => chat.chatId === chatId);
    setSelectedChatId(chatId);
    setSelectedChat(selected);
    // console.log("Chat ausgewählt:", selected);
    await handleMarkMessagesAsRead(selected); // Mark messages as read for selected chat
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

  const handleSendMessage = async (receiverId) => {
    const message = newMessage;
    const selectedChat = chats.find((chat) => chat.chatId === selectedChatId);
    console.log("handleSendMessage aufgerufen mit receiverId:", receiverId);
    console.log("selectedChat vor dem Senden:", selectedChat);

    const publicKey = await importPublicKey(selectedChat.publicKey);
    const encryptedMessage = await encryptMessage(publicKey, message);
    const encryptedMessageBase64 = arrayBufferToBase64(encryptedMessage);

    try {
      if (selectedChat.isGroupMessage) {
        await sendMessage(accessToken, message, receiverId);
      } else {
        await sendMessage(accessToken, message, receiverId);

        // const publicKeySelf = await importPublicKey(publicKeyPara);
        // const encryptedMessageSelf = await encryptMessage(
        //   publicKeySelf,
        //   message
        // );
        // const encryptedMessageSelfBase64 =
        //   arrayBufferToBase64(encryptedMessageSelf);

        // await sendMessage(
        //   accessToken,
        //   encryptedMessageSelfBase64,
        //   receiverId,
        //   userId
        // );
      }

      setNewMessage("");
    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error);
    }

    setSelectedChatId(receiverId);
  };

  useEffect(() => {
    // console.log("Main useEffect aufgerufen");
    // console.log("userData:", userData);
    // console.log("userId:", userId);
    // console.log("privateKeyPara:", privateKeyPara);
    if (userId && privateKeyPara) {
      const fetchChats = async () => {
        try {
          setLoadingChats(true);
          // console.log("Lade Chats...");
          // console.log("userData:", userData);

          // Warte auf die Auflösung von organizeChatsByUserId
          const organizedChats = organizeChatsByUserId(
            userData,
            userId,
            privateKeyPara
          );

          // console.log("Chats erfolgreich organisiert:", organizedChats);

          // Setze die aufgelösten Chats im State
          setChats(organizedChats);
          console.log("Chats gesetzt:", organizedChats);

          // Extrahiere die chatIds aus den aufgelösten Chats
          setChatIds(organizedChats.map((chat) => chat.chatId));
        } catch (error) {
          console.log("Fehler beim Organisieren der Chats:", error);
        } finally {
          setLoadingChats(false);
          // console.log("Chats laden beendet.");
        }
      };

      fetchChats();
    }
  }, [userData, userId, privateKeyPara]);

  useEffect(() => {
    if (!loadingChats && selectedChatId) {
      // console.log("Finde Chat mit selectedChatId:", selectedChatId);
      const selected = chats.find((chat) => chat.chatId === selectedChatId);
      if (selected) {
        setSelectedChat(selected);
        // console.log("Selected Chat nach Update gesetzt:", selected);
      } else {
        console.log("Kein Chat mit dieser ID gefunden:", selectedChatId);
      }
    }
  }, [loadingChats, selectedChatId, chats]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200">
      {/* Header with menu button */}
      <div className="flex justify-between items-center p-4  shadow-md ">
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
            <div className="absolute right-4 mt-2 bg-white  border rounded-lg shadow-lg w-48 py-2">
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
              <button
                className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-100"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 p-4 shadow-md flex flex-col">
          <h2 className="text-2xl mb-6 text-gray-800 font-bold">Chats</h2>
          <ul className="flex-1">
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
                  className={`p-3 mb-2 cursor-pointer flex flex-row justify-between rounded-lg transition-all duration-200 ${
                    selectedChatId === chatId
                      ? "bg-blue-500 bg-opacity-20 text-white shadow-lg transform hover:scale-105"
                      : "hover:bg-gray-100 hover:bg-opacity-40"
                  }`}
                  onClick={() => selectChat(chatId)}
                >
                  <div className="text-gray-900 font-medium">{chatName}</div>
                  {chat.numberOfUnreadMessages > 0 && (
                    <div className="bg-blue-500 rounded-full text-white w-6 h-6 flex items-center justify-center">
                      {chat.numberOfUnreadMessages}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-6">
            <button
              className="w-full rounded-lg p-3 bg-purple-500 bg-opacity-20 text-black shadow-lg transform hover:scale-105 transition-transform mb-4"
              onClick={() => setShowNewChatPopup(true)}
            >
              New Chat
            </button>
            <button
              className="w-full rounded-lg p-3 bg-pink-500 bg-opacity-20 text-black shadow-lg transform hover:scale-105 transition-transform"
              onClick={() => setShowNewGroupPopup(true)}
            >
              New Group
            </button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 p-4 h-full">
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
                      className="mr-2 p-2 bg-red-500 bg-opacity-20 text-black rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      onClick={() => setShowLeaveGroup(true)}
                    >
                      Leave Group
                    </button>
                    <button
                      className="p-2 bg-indigo-500 bg-opacity-40 text-black rounded-lg shadow-md hover:shadow-lg transition-shadow"
                      onClick={() => setShowAddGroupMember(true)}
                    >
                      Add Member
                    </button>
                  </div>
                )}
              </div>

              <div className="border rounded-2xl border-gray-300 p-4 overflow-y-auto flex-1 bg-gray-50 bg-opacity-80 shadow-inner flex flex-col-reverse">
                {selectedChat?.withUser?.isTyping ? (
                  <div className="mb-2">
                    <span className="text-sm text-gray-500">
                      {selectedChat.withUser.fullname}
                    </span>
                    <br />
                    <span className="inline-block p-2 rounded-lg">
                      {"types..."}
                    </span>
                  </div>
                ) : null}

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
                          <span className="inline-block p-2 rounded-lg">
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
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a chat to start messaging</p>
            </div>
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

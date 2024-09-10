import { useState, useEffect, useRef } from "react";
import axios from "axios";

const useChat = (accessToken, userId) => {
  const [userData, setUserData] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChatPopup, setShowNewChatPopup] = useState(false);
  const [showNewGroupPopup, setShowNewGroupPopup] = useState(false);
  const [showLeaveGroup, setShowLeaveGroup] = useState(false);
  const [showAddGroupMember, setShowAddGroupMember] = useState(false);
  const [isTyping, setIsTyping] = useState(false); // Zustand für das Tippen
  const [isTypingUser, setIsTypingUser] = useState(null); // Zustand für das Tippen

  const socketRef = useRef(null); // WebSocket-Ref für Verbindung

  const fetchUserData = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/users/${userId}/all_data`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setUserData(response.data);
    } catch (err) {
      console.error("Failed to fetch user data", err);
    }
  };

  useEffect(() => {
    fetchUserData();

    socketRef.current = new WebSocket("ws://localhost:8000/ws");

    socketRef.current.onopen = () => {
      // console.log("WebSocket verbunden");
    };

    socketRef.current.onmessage = (event) => {
      try {
        const messageData = JSON.parse(event.data); // Nachricht parsen
        const messageType = messageData.type;

        // console.log("WebSocket message received:", messageData);
        // console.log("WebSocket message type:", messageType);

        switch (messageType) {
          case "typing":
            // console.log("Typing message received:", messageData);
            fetchUserData();
            break;
          case "message":
            fetchUserData(); // Aktualisiere die Benutzer- oder Nachrichtenliste
            break;
          default:
            // console.log("Unknown message type:", messageType);
            break;
        }
      } catch (error) {
        // console.error("Failed to parse WebSocket message:", event.data);
        fetchUserData();
      }
    };

    socketRef.current.onclose = () => {
      // console.log("WebSocket geschlossen");
    };

    return () => {
      socketRef.current.close();
    };
    // eslint-disable-next-line
  }, [accessToken, userId]);

  useEffect(() => {
    const updateTypingStatus = async () => {
      // console.log("Selected chat ID:", selectedChatId);
      if (!selectedChatId) return;
      try {
        // Sende eine POST-Anfrage an die API, um den Typing-Status zu aktualisieren
        await axios.post(
          "http://localhost:8000/users/set_typing_status",
          {
            is_typing: isTyping,
            typing_chat_id: selectedChatId, // Payload mit dem neuen Typing-Status
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        // console.log(response.data); // Erfolgsnachricht

        // Sende eine Nachricht an den WebSocket, wenn isTyping geändert wird
        if (
          socketRef.current &&
          socketRef.current.readyState === WebSocket.OPEN
        ) {
          socketRef.current.send(
            JSON.stringify({
              type: "typing",
              isTyping: isTyping,
              userId: userId,
            })
          );
        }
      } catch (error) {
        console.error("Fehler beim Aktualisieren des Typing-Status:", error);
      }
    };

    updateTypingStatus();
  }, [isTyping, userId, accessToken, selectedChatId]); // Abhängigkeiten beibehalten

  const handleTyping = () => {
    // console.log("Typing...");
    setIsTyping(true);
    setIsTypingUser(userId);

    clearTimeout(window.typingTimeout);

    // Setzt isTyping auf false nach 1 Sekunde Inaktivität
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  return {
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
    fetchUserData,
    isTyping,
    isTypingUser, // Exportiere den Typing-Status
    handleTyping, // Exportiere die handleTyping Funktion
  };
};

export default useChat;

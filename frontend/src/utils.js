import { decryptMessage } from "./crypto";

function organizeChatsByUserId(data, userId, privateKeyPara) {
  const chats = [];

  if (!data) {
    return [];
  }

  // Erstelle zuerst Einträge für alle Privatchats
  data.interacting_users.forEach((user) => {
    if (user.id !== userId) {
      // Überspringe die eigene ID

      chats.push({
        chatId: user.id,
        isGroupMessage: false,
        publicKey: user.publicKey,
        withUser: {
          userId: user.id,
          username: user.username,
          fullname: user.fullname,
          isTyping:
            user.typingChatId === userId && user.isTyping ? true : false,
        },
        messages: [],
      });
    }
  });

  // Erstelle dann Einträge für alle Gruppenchats
  data.groups.forEach((group) => {
    const groupMembers = data.memberships
      .filter((membership) => membership.group_id === group.id)
      .map((membership) => {
        // console.log(membership);
        const member = data.interacting_users.find(
          (u) => u.id === membership.user_id
        );
        return {
          userId: member.id,
          username: member.username,
          fullname: member.fullname,
          isTyping:
            member.typingChatId === group.id && member.isTyping ? true : false,
        };
      });

    if (groupMembers.find((member) => member.userId === userId)) {
      // Füge nur Gruppen hinzu, in denen der Benutzer Mitglied ist
      chats.push({
        chatId: group.id,
        publicKey: group.publicKey,
        isGroupMessage: true,
        groupName: group.name,
        members: groupMembers,
        messages: [],
      });
    }
  });

  // Jetzt füge die Nachrichten zu den entsprechenden Chats hinzu
  data.messages.forEach(async (message) => {
    const isPrivateMessage =
      (message.sender_id === userId || message.receiver_id === userId) &&
      !data.groups.some((group) => group.id === message.receiver_id);

    const isGroupMessage = data.groups.some(
      (group) => group.id === message.receiver_id
    );

    if (isPrivateMessage) {
      const chatPartnerId =
        message.sender_id === userId ? message.receiver_id : message.sender_id;
      const chat = chats.find((c) => c.chatId === chatPartnerId);
      if (chat) {
        let decryptedContent = message.content;
        // try {
        //   // Entschlüssele den Inhalt der Nachricht
        //   decryptedContent = decryptMessage(
        //     privateKeyPara,
        //     message.content
        //   );
        // } catch (error) {
        //   console.error("Fehler beim Entschlüsseln der Nachricht:", error);
        //   decryptedContent = "Fehler beim Entschlüsseln"; // Setze eine Standardfehlermeldung
        // }

        chat.messages.push({
          content: decryptedContent, // Verwende die entschlüsselte Nachricht
          id: message.id,
          timestamp: message.timestamp,
          status: message.status,
          sender: {
            userId: message.sender_id,
            username: data.interacting_users.find(
              (u) => u.id === message.sender_id
            )?.username,
            fullname: data.interacting_users.find(
              (u) => u.id === message.sender_id
            )?.fullname,
          },
          receiver: {
            userId: message.receiver_id,
            username: data.interacting_users.find(
              (u) => u.id === message.receiver_id
            )?.username,
            fullname: data.interacting_users.find(
              (u) => u.id === message.receiver_id
            )?.fullname,
          },
        });
      }
    } else if (isGroupMessage) {
      const group = data.groups.find((g) => g.id === message.receiver_id);
      const chat = chats.find((c) => c.chatId === group.id);
      if (chat) {
        chat.messages.push({
          content: message.content,
          id: message.id,
          timestamp: message.timestamp,
          status: message.status,
          sender: {
            userId: message.sender_id,
            username:
              data.interacting_users.find((u) => u.id === message.sender_id)
                ?.username || "System",
            fullname:
              data.interacting_users.find((u) => u.id === message.sender_id)
                ?.fullname || "System",
          },
          receiver: {
            userId: "Group",
            username: group.name,
            fullname: group.name,
          },
        });
      }
    }
  });

  chats.forEach((chat) => {
    if (chat.isGroupMessage) {
      data.memberships.forEach((member) => {
        if (chat.chatId === member.group_id) {
          chat.joined = member.joined_at;
        }
      });
    }
  });

  // Sortiere die Nachrichten in jedem Chat absteigend nach dem Zeitstempel
  chats.forEach((chat) => {
    // Sortiere die Nachrichten nach dem Timestamp
    chat.messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Zähle die ungelesenen Nachrichten
    const unreadMessagesCount = chat.messages.filter(
      (message) => message.status === "sent"
    ).length;

    // Füge die Anzahl der ungelesenen Nachrichten hinzu
    chat.numberOfUnreadMessages = unreadMessagesCount;
  });

  chats.sort((a, b) => {
    // Überprüfen, ob a.messages leer ist
    const lastMessageA =
      a.messages.length > 0 ? a.messages[0] : { timestamp: a.joined };
    // Überprüfen, ob b.messages leer ist
    const lastMessageB =
      b.messages.length > 0 ? b.messages[0] : { timestamp: b.joined };

    // Konvertiere die Timestamps in Date-Objekte und vergleiche sie
    return new Date(lastMessageB.timestamp) - new Date(lastMessageA.timestamp);
  });

  const chatsCopy = [...chats];

  // console.log(chatsCopy);

  //   console.log(chatsCopy);
  // Entferne leere Privatchats
  // const filteredChats = chatsCopy.filter(
  //   (chat) => !(chat.isGroupMessage === false && chat.messages.length === 0)
  // );

  let filteredChats = [];

  for (let i = 0; i < chatsCopy.length; i++) {
    if (
      !(
        chatsCopy[i].isGroupMessage === false &&
        chatsCopy[i].messages.length === 0
      )
    ) {
      filteredChats.push(chatsCopy[i]);
    }
  }

  //   return chats;
  // console.log(filteredChats);
  return filteredChats;
  // return chatsCopy;
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.toDateString() === now.toDateString();
  const isThisWeek = now - date < 7 * 24 * 60 * 60 * 1000;

  if (isToday) {
    // Zeitformat HH:MM
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (isThisWeek) {
    // Format Wochentag HH:MM
    return (
      date.toLocaleDateString("de-DE", { weekday: "short" }) +
      " " +
      date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    );
  } else {
    // Format DD.MM.YYYY HH:MM
    return (
      date.toLocaleDateString("de-DE") +
      " " +
      date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })
    );
  }
}

function getFullnamesFromChat(chat) {
  if (chat.isGroupMessage && chat.members) {
    return chat.members.map((member) => member.fullname);
  }
  return [];
}

export { organizeChatsByUserId, formatTimestamp, getFullnamesFromChat };

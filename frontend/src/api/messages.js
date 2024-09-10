import axios from "axios";

const BASE_URL = "http://localhost:8000";

export const sendMessage = async (
  accessToken,
  content,
  receiverId,
  encryptedForUserId
) => {
  return await axios.post(
    `${BASE_URL}/messages/send_message`,
    {
      content,
      receiver_id: receiverId,
      encrypted_for_user_id: encryptedForUserId,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
};

export const markMessagesAsRead = async (accessToken, userId, messageIds) => {
  return await axios.put(
    `${BASE_URL}/messages/read`,
    {
      user_id: userId,
      message_ids: messageIds,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );
};

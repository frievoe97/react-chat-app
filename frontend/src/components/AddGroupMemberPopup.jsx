import React, { useState } from "react";
import axios from "axios";

const AddGroupMemberPopup = ({ accessToken, selectedChatId, onClose }) => {
  const [newMemberUsername, setNewMemberUsername] = useState("");

  const addMemberToGroup = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/users/user_id/${newMemberUsername}`
      );
      const userId = response.data.user_id;

      if (!userId) {
        console.error("User ID not found");
        return;
      }

      const addResponse = await axios.post(
        "http://localhost:8000/groups/add_user_to_group",
        {
          user_id: userId,
          group_id: selectedChatId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Member added to group:", addResponse.data);
      onClose();
    } catch (error) {
      console.error("Error in adding member to group:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-1/3">
        <h2 className="text-xl mb-4 text-gray-700">Add New Member</h2>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter Username"
          value={newMemberUsername}
          onChange={(e) => setNewMemberUsername(e.target.value)}
        />
        <button
          className="mr-2 p-2 bg-blue-400 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          onClick={addMemberToGroup}
        >
          Add Member
        </button>
        <button
          className="p-2 bg-red-400 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddGroupMemberPopup;

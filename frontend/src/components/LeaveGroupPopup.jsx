import React from "react";
import axios from "axios";

const LeaveGroupPopup = ({ accessToken, selectedChatId, onClose }) => {
  const leaveGroup = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/groups/leave_group",
        { group_id: selectedChatId },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Group left:", response.data);
    } catch (error) {
      console.error("Error leaving group:", error);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-1/3">
        <h2 className="text-xl mb-4 text-gray-700">Leave Group</h2>
        <p className="mb-4 text-gray-600">
          Are you sure you want to leave the group?
        </p>
        <button
          className="mr-2 p-2 bg-red-400 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          onClick={leaveGroup}
        >
          Confirm
        </button>
        <button
          className="p-2 bg-gray-400 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LeaveGroupPopup;

import React, { useState } from "react";
import axios from "axios";

const NewGroupPopup = ({ accessToken, onClose }) => {
  const [groupName, setGroupName] = useState("");

  const createGroup = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/groups/create_group",
        {
          name: groupName,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log("Group created:", response.data);
    } catch (error) {
      console.error("Error in creating group:", error);
    } finally {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-1/3">
        <h2 className="text-xl mb-4 text-gray-700">Create New Group</h2>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Enter Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              createGroup();
            }
          }}
        />
        <button
          className="mr-2 p-2 bg-purple-400 text-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          onClick={createGroup}
        >
          Create Group
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

export default NewGroupPopup;

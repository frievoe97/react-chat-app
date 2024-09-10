import axios from "axios";

const BASE_URL = "http://localhost:8000";

export const loginUser = async (username, password) => {
  const url = `${BASE_URL}/users/login`;
  return await axios.post(url, { username, password });
};

export const registerUser = async (username, fullName, password) => {
  const url = `${BASE_URL}/users/register`;
  return await axios.post(url, { username, full_name: fullName, password });
};

import React, { useState } from "react";
import { loginUser, registerUser } from "./api/auth";

const AuthForm = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function isPasswordStrong(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // if (!isPasswordStrong(password)) {
    //   setError(
    //     "Password is not strong enough. The password must contain at least 1 uppercase letter, 1 lowercase letter, 1 special character, 1 number, and at least 8 characters."
    //   );
    //   return;
    // }

    try {
      const response = isLogin
        ? await loginUser(username, password)
        : await registerUser(username, fullName, password);

      // setMessage(`Success: ${response.data.access_token}`);

      if (isLogin && onLoginSuccess) {
        onLoginSuccess(
          response.data.access_token,
          response.data.user_id,
          response.data.private_key,
          response.data.public_key
        );
      }

      if (!isLogin) {
        setIsLogin(true);
        setMessage("User registered successfully. You can now login.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200">
      <form
        className="bg-white p-6 rounded-2xl shadow-2xl w-80"
        onSubmit={handleAuth}
      >
        <h2 className="text-2xl mb-4 text-center font-bold">
          {isLogin ? "Login" : "Register"}
        </h2>

        <div className="mb-4">
          <label className="block mb-1 text-gray-600">Username</label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {!isLogin && (
          <div className="mb-4">
            <label className="block mb-1 text-gray-600">Full Name</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-1 text-gray-600">Password</label>
          <input
            type="password"
            className="w-full p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}
        {message && <div className="text-green-500 mb-4">{message}</div>}

        <button
          type="submit"
          className="w-full p-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
        >
          {isLogin ? "Login" : "Register"}
        </button>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-gray-400 underline hover:text-gray-600"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin
              ? "Need an account? Register"
              : "Already have an account? Login"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;

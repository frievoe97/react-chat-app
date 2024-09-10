import React, { useState } from "react";
import AuthForm from "./AuthForm";
import Main from "./Main";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [publicKey, setPublicKey] = useState(null);

  const handleLoginSuccess = (token, userId, privateKey, publicKey) => {
    setAccessToken(token);
    setUserId(userId);
    setPrivateKey(privateKey);
    setPublicKey(publicKey);
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log("Logout");
    setIsAuthenticated(false);
    setUserId(null);
    setAccessToken(null);
    setPrivateKey(null);
    setPublicKey(null);
  };

  return (
    <div>
      {isAuthenticated ? (
        <Main
          accessToken={accessToken}
          userId={userId}
          publicKeyPara={publicKey}
          privateKeyPara={privateKey}
          logout={logout}
        />
      ) : (
        <AuthForm onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;

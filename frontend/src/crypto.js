// Funktion zur Konvertierung des PEM-Schlüssels in ein CryptoKey-Objekt
async function importPublicKey(pem) {
  // console.log("importPublicKey", pem);
  // Entferne Header, Footer, Zeilenumbrüche und Leerzeichen
  const pemHeader = "-----BEGIN PUBLIC KEY-----";
  const pemFooter = "-----END PUBLIC KEY-----";
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, ""); // Entferne alle Leerzeichen und Zeilenumbrüche

  const binaryDerString = window.atob(pemContents);
  const binaryDer = str2ab(binaryDerString);

  return await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: { name: "SHA-256" },
    },
    true,
    ["encrypt"]
  );
}

async function importPrivateKey(pem) {
  //   console.log("importPrivateKey", pem);
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");

  const binaryDerString = window.atob(pemContents);
  const binaryDer = str2ab(binaryDerString);

  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: { name: "SHA-256" },
    },
    true,
    ["decrypt"]
  );
}

// Hilfsfunktion zur Umwandlung einer Binärzeichenkette in einen ArrayBuffer
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

async function encryptMessage(publicKey, message) {
  const encoder = new TextEncoder();
  const encodedMessage = encoder.encode(message);

  const encryptedMessage = await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    encodedMessage
  );

  return encryptedMessage;
}

function decryptMessage(privateKeyPem, encryptedMessageBase64) {
  return importPrivateKey(privateKeyPem)
    .then((privateKey) => {
      const encryptedMessageArrayBuffer = base64ToArrayBuffer(
        encryptedMessageBase64
      );
      return window.crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        privateKey,
        encryptedMessageArrayBuffer
      );
    })
    .then((decryptedMessage) => {
      const decoder = new TextDecoder();
      return decoder.decode(decryptedMessage);
    })
    .catch((error) => {
      console.error("Error during decryption process:", error);
      throw error;
    });
}

function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export {
  encryptMessage,
  importPublicKey,
  arrayBufferToBase64,
  decryptMessage,
  importPrivateKey,
};

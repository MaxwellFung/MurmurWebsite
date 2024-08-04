import { getFirestore, collection, addDoc, doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-auth.js";
import { auth, db } from '/js/config.js';

window.addEventListener('load', () => {
  function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  const docID = getUrlParameter('docID');
  const encryptKey = getUrlParameter('encryptKey');

  
  async function encryptSend() {
    const encryptedURL = await aesGcmEncrypt(window.location.href, encryptKey);

    await setDoc(doc(db, 'logins', docID), {
      href: encryptedURL
    }, {merge:true});
  }
  encryptSend();


});

async function aesGcmEncrypt(plaintext, password) {
    const pwUtf8 = new TextEncoder().encode(password);
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ivStr = Array.from(iv).map(b => String.fromCharCode(b)).join('');

    const alg = { name: 'AES-GCM', iv: iv };

    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']);

    const ptUint8 = new TextEncoder().encode(plaintext);
    const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8);

    const ctArray = Array.from(new Uint8Array(ctBuffer));
    const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join('');

    return btoa(ivStr + ctStr);
}
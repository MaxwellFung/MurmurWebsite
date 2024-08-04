import { getFirestore, collection, addDoc, doc, setDoc, getDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-app.js";
import { getAuth, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, onAuthStateChanged, fetchSignInMethodsForEmail } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-auth.js";
import { auth, db } from './config.js';

const createAccountModal = document.getElementById("create-account-modal");
const step1 = document.getElementById("create-account-step1");
const step2 = document.getElementById("create-account-step2");
const step3 = document.getElementById("create-account-step3");
const step4 = document.getElementById("create-account-step4");
const crushesContainer = document.getElementById("crushes-container");
const infoButton = document.getElementById("info-button");
const popupContainer = document.createElement("div");
const popupText = document.createElement("div");
const closePopup = document.createElement("div");
const createAccountError = document.getElementById("create-account-error");
let emailVerificationCheckInterval;

const addCrushButton = document.getElementById("crush-button");
const maxCrushes = 3;

createAccountModal.style.display = "none";
window.openCreateAccountModal = function() {
  step1.style.display = "flex";
  step2.style.display = "none";
  step3.style.display = "none";
  step4.style.display = "none";
  createAccountModal.style.display = "flex";
};

window.closeCreateAccountModal = function() {
  createAccountModal.style.display = "none";
};

window.closeLoginModal = function() {
  document.getElementById('login-modal').style.display = 'none';
}


const loginModal = document.getElementById("login-modal");


window.loginUser = async function() {
  const email = document.querySelector('input[type="text"]').value;
  const loginError = document.getElementById("login-error");
  

  const docID = generateRandomId();
  const encryptKey = generateRandomPassword();

  const actionCodeSettings = {
    url: `http://murmurmatch.com/verified.html?docID=${docID}&encryptKey=${encryptKey}`,
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    loginModal.style.display = "flex";

    const unsubscribe = onSnapshot(doc(db, 'logins', docID), async (docVerify) => {
      console.log(docVerify.data().href);
      const decodedURL = await aesGcmDecrypt(docVerify.data().href, encryptKey);
      if (isSignInWithEmailLink(auth, decodedURL)) {
        const result = await signInWithEmailLink(auth, email, decodedURL);
        
        await deleteDoc(doc(db, 'logins', docID));
        const userDomain = email.split("@")[1];
        localStorage.setItem("domain", userDomain);
        
        const userDoc = await getDoc(doc(db, userDomain, result.user.uid));

        if(userDoc.exists()){
          loginModal.style.display = "none";
          window.location.href = "main.html";
        } else{
//          loginModal.style.display = "none";
//          alert('Please first create an account');
          loginModal.style.display = "none";
          createAccountModal.style.display = "flex";
          step3.style.display = "flex";
          const emailDomainSpans = document.querySelectorAll('.email-domain');
          emailDomainSpans.forEach(span => {
            span.textContent = "@" + userDomain;
          });
        }

      }
    });
    

  } catch (error) {
    loginError.style.display = "block";
    loginError.textContent = error.message;
  }
};



document.addEventListener("DOMContentLoaded", function () {
  popupContainer.classList.add("popup-container");
  popupContainer.style.display = "none";

  popupText.classList.add("popup-text");
  popupText.textContent = "Introducing Murmur! Simply input the name and school emails of people you secretly like, and if there's a mutual entry, you'll both get a notification signifying a match! Register with your school email to get started!";

  closePopup.classList.add("close-popup");
  closePopup.textContent = "✖";

  popupContainer.appendChild(popupText);
  popupContainer.appendChild(closePopup);
  document.body.appendChild(popupContainer);

  closePopup.addEventListener("click", function () {
    popupContainer.style.display = "none";
  });

  infoButton.addEventListener("click", function () {
    popupContainer.style.display = popupContainer.style.display === "none" ? "block" : "none";
  });

  const donate = document.getElementById('donate-button');
  donate.addEventListener('click', function() {
    window.open("https://github.com/MaxwellCurry/MurmurWebsite", "_blank");
  });
});

function generateRandomId() {
  return Math.random().toString(36).substr(2, 9);
}


async function aesGcmDecrypt(ciphertext, password) {
    const pwUtf8 = new TextEncoder().encode(password);
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);

    const ivStr = atob(ciphertext).slice(0, 12);
    const iv = new Uint8Array(Array.from(ivStr).map(ch => ch.charCodeAt(0)));

    const alg = { name: 'AES-GCM', iv: iv };

    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']);

    const ctStr = atob(ciphertext).slice(12);
    const ctUint8 = new Uint8Array(Array.from(ctStr).map(ch => ch.charCodeAt(0)));

    try {
        const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8);
        const plaintext = new TextDecoder().decode(plainBuffer);
        return plaintext;
    } catch (e) {
        throw new Error('Decrypt failed');
    }
}


function generateRandomPassword(length = 64) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    const charsetLength = charset.length;
    const cryptoObj = window.crypto || window.msCrypto; // for IE 11

    for (let i = 0; i < length; i++) {
        const randomIndex = cryptoObj.getRandomValues(new Uint32Array(1))[0] % charsetLength;
        password += charset[randomIndex];
    }

    return password;
}


window.nextStep = async function() {
  const email = document.getElementById("school-email").value;

  createAccountError.style.display = "none";
  createAccountError.textContent = "";

  try {
    const selectEmail = email;
    const docID = generateRandomId();
    const encryptKey = generateRandomPassword();
    
    console.log(encryptKey);
    const actionCodeSettings = {
        url: `http://murmurmatch.com/verified.html?docID=${docID}&encryptKey=${encryptKey}`,
        handleCodeInApp: true,
    };


    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    step1.style.display = "none";
    step2.style.display = "flex";
    

    const unsubscribe = onSnapshot(doc(db, 'logins', docID), async (docVerify) => {
      if (docVerify.exists() && docVerify.data().href !== undefined) {
        console.log(docVerify.data().href);
        const decodedURL = await aesGcmDecrypt(docVerify.data().href, encryptKey);
        if (isSignInWithEmailLink(auth, decodedURL)) {
          const result = await signInWithEmailLink(auth, selectEmail, decodedURL);
          await deleteDoc(doc(db, 'logins', docID));
          
          const schoolEmail = document.getElementById("school-email").value;
          const domain = schoolEmail.split("@")[1];
          const emailDomainSpans = document.querySelectorAll('.email-domain');
          emailDomainSpans.forEach(span => {
            span.textContent = "@" + domain;
          });
          
          console.log(result.user.uid);
          const userDoc = await getDoc(doc(db, domain, result.user.uid));
          
          if(userDoc.exists()){
            step2.style.display = "none";
            step3.style.display = "none";
            step4.style.display = "flex";
            return;
          } else{
            step2.style.display = "none";
            step3.style.display = "flex";
          }
    
        }
      }
    });
    
  } catch (error) {
    createAccountError.style.display = "block";
    createAccountError.textContent = error.message;
  }
};

window.addCrush = function() {
  const schoolEmail = document.getElementById("school-email").value;
  const domain = schoolEmail.split("@")[1];

  const crushInputs = document.querySelectorAll(".crush-email");
  if (crushInputs.length >= maxCrushes) {
    alert("You can only add up to 3 crushes.");
    return;
  }

  const crushInputWrapper = document.createElement("div");
  crushInputWrapper.classList.add("crush-input-wrapper");

  const deleteCrushButton = document.createElement("span");
  deleteCrushButton.classList.add("delete-crush");
  deleteCrushButton.textContent = "✖";
  deleteCrushButton.addEventListener("click", function() {
    crushInputWrapper.remove();
    updateAddCrushButtonState();
  });

  const newCrushInput = document.createElement("input");
  newCrushInput.type = "text";
  newCrushInput.classList.add("crush-email");
  newCrushInput.placeholder = "Peer's School Email";

  const emailDomainSpan = document.createElement("span");
  emailDomainSpan.classList.add("email-domain");
  emailDomainSpan.textContent = "@" + domain;

  crushInputWrapper.appendChild(deleteCrushButton);
  crushInputWrapper.appendChild(newCrushInput);
  crushInputWrapper.appendChild(emailDomainSpan);
  crushesContainer.appendChild(crushInputWrapper);

  // Disable the add crush button if the limit is reached
  if (crushInputs.length + 1 >= maxCrushes) {
    updateAddCrushButtonState();
  }
};

onAuthStateChanged(auth, user => {
  if (user) {
    console.log("User is signed in:", user);
    localStorage.setItem("user", JSON.stringify({
      email: user.email,
      uid: user.uid
    }));
    if (user.emailVerified) {
      step1.style.display = "none";
      step2.style.display = "none";
      step3.style.display = "flex";
      document.getElementById("login-email").value = user.email;
    } else {
      step1.style.display = "none";
      step2.style.display = "flex";
      step3.style.display = "none";
    }
  } else {
    clearInterval(emailVerificationCheckInterval);
  }
});

function updateAddCrushButtonState() {
  const crushInputs = document.querySelectorAll(".crush-email");
  if (crushInputs.length >= maxCrushes) {
    addCrushButton.style.backgroundColor = 'grey';
    addCrushButton.style.cursor = 'not-allowed';
    addCrushButton.disabled = true;
  } else {
    addCrushButton.style.backgroundColor = '';
    addCrushButton.style.cursor = '';
    addCrushButton.disabled = false;
  }
}

window.submit = async function() {
//  const name = document.getElementById("name").value;
  const user = JSON.parse(localStorage.getItem("user"));
  console.log(user);

  const crushEmails = [];
  const crushInputs = document.querySelectorAll(".crush-email");
  let hasEmptyFields = false;

  const regex = /<([^@]+)@/;
  const regex2 = /^([^@]+)/;
  crushInputs.forEach(input => {
    if (input.value.trim() === '') {
      hasEmptyFields = true;
    } else {
      const inputName = (input.value.includes('<') && input.value.includes('@')) ? input.value.match(regex)[1] : input.value;
      const inputName2 = (inputName.includes('@')) ? inputName.match(regex2)[1] : inputName; 
      crushEmails.push((inputName2 + input.nextElementSibling.textContent).toLowerCase());
    }
  });
  
  const firstName = document.getElementById("first-name").value;
  const lastName = document.getElementById("last-name").value;

  if (!firstName || !lastName) {
    alert("Please fill in both First Name and Last Name");
    return;
  }

  if (hasEmptyFields) {
    alert("Please fill or delete empty crush fields");
    return;
  }

  const userEmail = user.email;
  const userDomain = userEmail.split("@")[1];
  
  

  await setDoc(doc(db, userDomain, user.uid), {
    name: firstName + " " + lastName,
    email: userEmail,
    emailDomain: userDomain,
    crushes: crushEmails,
    emailedCrushes: crushEmails,
    createdAt: new Date().toISOString(),
    matches: []
  });
  
  await setDoc(doc(db, 'domains', userDomain), {
    updatedBy: userEmail
  });
  
  const response = await fetch('https://us-central1-murmurwebsite.cloudfunctions.net/sendEmail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ emails: crushEmails }),
  });
  
  localStorage.setItem("domain", userDomain);

  window.location.href = "main.html";
};

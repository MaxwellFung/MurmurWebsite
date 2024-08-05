import { Passwordless } from "amazon-cognito-passwordless-auth";
import { requestSignInLink, signInWithLink } from "amazon-cognito-passwordless-auth/magic-link";
require(style.css); 
var CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const createAccountModal = document.getElementById("create-account-modal");
const step1 = document.getElementById("create-account-step1");
const step2 = document.getElementById("create-account-step2");
const step3 = document.getElementById("create-account-step3");
const crushesContainer = document.getElementById("crushes-container");
const infoButton = document.getElementById("info-button");
const popupContainer = document.createElement("div");
const popupText = document.createElement("div");
const closePopup = document.createElement("div");
const createAccountError = document.getElementById("create-account-error");
let emailVerificationCheckInterval;

const addCrushButton = document.getElementById("crush-button");
const maxCrushes = 3;

Passwordless.configure({
  cognitoIdpEndpoint: "us-east-2", // you can also use the full endpoint URL, potentially to use a proxy
  clientId: "7pims036f36i8ma91ch0e9q6j3",
  userPoolId: "us-east-2_0lFvLnkfv",
  storage: localStorage, // Optional, default to localStorage
});

createAccountModal.style.display = "none";
window.openCreateAccountModal = function() {
  step1.style.display = "flex";
  step2.style.display = "none";
  step3.style.display = "none";
  createAccountModal.style.display = "flex";
};

window.closeCreateAccountModal = function() {
  createAccountModal.style.display = "none";
};

window.loginUser = async function() {
  const emailInput = document.querySelector('input[type="text"]');
  const passwordInput = document.querySelector('input[type="password"]');
  const email = emailInput.value;
  const password = passwordInput.value;
  const loginError = document.getElementById("login-error");

  /*
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    localStorage.setItem("domain", email.split("@")[1]);
    window.location.href = "main.html";
  } catch (error) {
    loginError.style.display = "block";
    loginError.textContent = error.message;
  }*/
};

document.addEventListener("DOMContentLoaded", function () {
  popupContainer.classList.add("popup-container");
  popupContainer.style.display = "none";

  popupText.classList.add("popup-text");
  popupText.textContent = "Introducing Murmur! Simply input the name and school emails of people you secretly like, and if there's a mutual entry, you'll both get a notification signifying a match! Register with your school email to get started!";

  closePopup.classList.add("close-popup");
  closePopup.textContent = "âœ–";

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

function handleError(err) {
  clearInterval(emailVerificationCheckInterval);
  createAccountError.style.display = "block";
  createAccountError.textContent = err.message || JSON.stringify(err);
}

window.nextStep = async function() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("school-email").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  createAccountError.style.display = "none";
  createAccountError.textContent = "";

  if (password !== confirmPassword) {
    createAccountError.style.display = "block";
    createAccountError.textContent = "Passwords do not match.";
    return;
  }

  try { 

    const { signInLinkRequested } = requestSignInLink({ email : email, given_name : name });
    try {
      await signInLinkRequested;
      console.log("We've emailed you a secret sign-in link")
    } catch(err) {
      console.log("Oops", err)
    }
    
    const { signedIn } = signInWithLink({
      statusCb: console.log, // will log e.g. SIGNED_IN_WITH_LINK, NO_SIGNIN_LINK, SIGNIN_LINK_EXPIRED, ...
    });
    await signedIn;
    
    step2.style.display = "none";
    step3.style.display = "flex";
    document.getElementById("login-email").value = email; 

    const schoolEmail = document.getElementById("school-email").value;
    const domain = schoolEmail.split("@")[1];
    const emailDomainSpans = document.querySelectorAll('.email-domain');
    emailDomainSpans.forEach(span => {
      span.textContent = "@" + domain;
    });

      //idk what this part does ngl
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
  deleteCrushButton.textContent = "âœ–";
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

window.submit = async function() {
  const name = document.getElementById("name").value;
  const user = JSON.parse(localStorage.getItem("user"));

  const crushEmails = [];
  const crushInputs = document.querySelectorAll(".crush-email");
  let hasEmptyFields = false;

  crushInputs.forEach(input => {
    if (input.value.trim() === '') {
      hasEmptyFields = true;
    } else {
      crushEmails.push((input.value + input.nextElementSibling.textContent).toLowerCase());
    }
  });

  if (hasEmptyFields) {
    alert("Please fill or delete empty crush fields");
    return;
  }

  const userEmail = user.email;
  const userDomain = userEmail.split("@")[1];

  /*

  await setDoc(doc(db, userDomain, user.uid), {
    name: name,
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
    method: 'POST', // Use the POST method
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ emails: crushEmails }),
  });
  
  localStorage.setItem("domain", userDomain);
  */

  window.location.href = "main.html";
};
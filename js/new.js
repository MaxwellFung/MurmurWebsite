import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { getAuth, deleteUser, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-auth.js";
import { db, auth } from './config.js';

const user = JSON.parse(localStorage.getItem('user'));
const userDomain = localStorage.getItem('domain');
if (!user) {
  window.location.href = "index.html";
}
const userUID = user.uid;

const editButton = document.getElementById("editButton");
const inputElements = document.querySelectorAll(".profile-info input");
let currentPopup = null;
let emailedCrushes;

document.addEventListener('DOMContentLoaded', function() {
  fetchUserProfile();
});

async function fetchUserProfile() {
  const userDocRef = doc(db, userDomain, userUID);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    const crushes = userData.crushes;
    document.getElementById('profileNameSpan').textContent = userData.email;

    document.getElementById('nameInput').value = userData.name;

    if (crushes[0]) {
      document.getElementById('crush1email').value = crushes[0];
    }
    if (crushes[1]) {
      document.getElementById('crush2email').value = crushes[1];
    }
    if (crushes[2]) {
      document.getElementById('crush3email').value = crushes[2];
    }

    userData.matches.forEach(match => {
      addNotification("Matched with: " + match, "You have a new match!");
    });
    
    emailedCrushes = userData.emailedCrushes;

  } else {
    console.log("No such document!");
  }
}

document.getElementById('signButton').addEventListener('click', () => {
  getAuth().signOut().then(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('domain');
    window.location.href = 'index.html'; // Redirect to login page
  }).catch((error) => {
    console.error("Error signing out: ", error);
  });
});

document.getElementById('profileButton').addEventListener('click', () => {
  const profileModal = document.getElementById('profileModal');
  profileModal.style.display = "block";
});

document.getElementById('closeModal').addEventListener('click', () => {
  const profileModal = document.getElementById('profileModal');
  profileModal.style.display = "none";
});

window.addEventListener('click', (event) => {
  const profileModal = document.getElementById('profileModal');
  if (event.target === profileModal) {
    profileModal.style.display = "none";
  }
});

editButton.addEventListener("click", async function() {
  if (editButton.textContent === "Edit") {
    editButton.textContent = "Submit";
    inputElements.forEach(function(input) {
      input.disabled = false;
    });
  } else {
    const crushes = [];

    if (document.getElementById('crush1email').value !== '') {
      crushes.push(document.getElementById('crush1email').value.toLowerCase());
    }
    if (document.getElementById('crush2email').value !== '') {
      crushes.push(document.getElementById('crush2email').value.toLowerCase());
    }
    if (document.getElementById('crush3email').value !== '') {
      crushes.push(document.getElementById('crush3email').value.toLowerCase());
    }

    editButton.textContent = "Edit";
    inputElements.forEach(function(input) {
      input.disabled = true;
    });
    
    alert('Info Submitted');

    
    
    const emailList = crushes.filter(element => !emailedCrushes.includes(element));
    console.log(emailList);

    if (emailList.length > 0) {
      const response = await fetch('https://us-central1-murmurwebsite.cloudfunctions.net/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: emailList }),
      });

      if (response.ok) {
        emailedCrushes = emailedCrushes.concat(emailList);
      } else {
        console.error('Failed to send emails');
      }
    } else {
      console.log('No new crushes to email');
    }

    await setDoc(doc(db, userDomain, userUID), {
      name: document.getElementById('nameInput').value,
      crushes: crushes,
      emailedCrushes: emailedCrushes
    }, { merge: true });
  }
});

document.getElementById("deleteButton").addEventListener("click", async function() {
  const password = prompt("Please enter your password to confirm:");
  if (password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, user.email, password);
      await deleteDoc(doc(db, userDomain, userUID));
      await deleteUser(userCredential.user);
      console.log("Document successfully deleted!");
      window.location.href = "../index.html";
    } catch (error) {
      alert(error);
    }
  }
});

function showPopup(message) {
  if (currentPopup !== null) {
    document.body.removeChild(currentPopup);
    currentPopup = null;
  }

  const popup = document.createElement('div');
  popup.classList.add('popup');
  popup.textContent = message;

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', function() {
    document.body.removeChild(popup);
    currentPopup = null;
  });
  popup.appendChild(closeButton);
  document.body.appendChild(popup);
  currentPopup = popup;
}

function addNotification(message, popupMessage) {
  const notificationBox = document.getElementById('notificationBox');
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.textContent = message;

  notification.addEventListener('click', function() {
    showPopup(popupMessage);
  });

  notificationBox.appendChild(notification);
}

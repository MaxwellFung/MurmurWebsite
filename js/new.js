import { getFirestore, doc, getDoc, setDoc, deleteDoc, query, where, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-firestore.js";
import { getAuth, deleteUser, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.4.0/firebase-auth.js";
import { db, auth } from './config.js';


const user = JSON.parse(localStorage.getItem('user'));
const userDomain = localStorage.getItem('domain');
if (!user) {
  window.location.href = "index.html";
}
const userUID = user.uid;

const editButton = document.getElementById("editButton");
const inputElements = document.querySelectorAll(".profile-info input");
const crushContainer = document.getElementById('crushContainer');
const addCrushButton = document.getElementById('addCrushButton');
let currentPopup = null;
let emailedCrushes = [];
let crushCount = 0;

let userObject;

const convoMap = new Map();

onAuthStateChanged(auth, user => {
  if (user) {
    userObject = user;
  }
});

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

    crushes.forEach((crush, index) => {
      addCrushInput(crush, index + 1);
    });

    userData.matches.forEach(match => {
      addNotification(match);
    });

    emailedCrushes = userData.emailedCrushes;
  } else {
    console.log("No such document!");
  }
}

function addCrushInput(email = '', index) {
  const crushDiv = document.createElement('div');
  crushDiv.classList.add('crush-div');

  const label = document.createElement('span');
  label.textContent = `${index}. `;
  crushDiv.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.classList.add('crushemail-input');
  input.value = email;
  input.placeholder = `${index}st School Email`;
  input.disabled = editButton.textContent === 'Edit';
  crushDiv.appendChild(input);

  const removeButton = document.createElement('button');
  removeButton.textContent = 'x';
  removeButton.classList.add('remove-crush-button');
  removeButton.disabled = editButton.textContent === 'Edit';
  removeButton.addEventListener('click', () => {
    crushContainer.removeChild(crushDiv);
    crushCount--;
    updateCrushInputPlaceholders();
    toggleAddCrushButton();
  });
  crushDiv.appendChild(removeButton);

  crushContainer.appendChild(crushDiv);
  crushCount++;
}

function updateCrushInputPlaceholders() {
  const crushInputs = document.querySelectorAll('.crush-div');
  crushInputs.forEach((div, index) => {
    const input = div.querySelector('input');
    const label = div.querySelector('span');
    label.textContent = `${index + 1}. `;
    input.placeholder = `${index + 1}st School Email`;
  });
}

function toggleAddCrushButton() {
  addCrushButton.disabled = crushCount >= 3;
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

document.getElementById('closeProfileModal').addEventListener('click', () => {
  const profileModal = document.getElementById('profileModal');
  profileModal.style.display = "none";
});

document.getElementById('closeMessageModal').addEventListener('click', () => {
  const messageModal = document.getElementById('messageModal');
  messageModal.style.display = "none";
});

window.addEventListener('click', (event) => {
  const profileModal = document.getElementById('profileModal');
  const messageModal = document.getElementById('messageModal');
  if (event.target === profileModal) {
    profileModal.style.display = "none";
  } else if (event.target === messageModal) {
    messageModal.style.display = "none";
  }
});

editButton.addEventListener("click", async function() {
  const isEditing = editButton.textContent === "Edit";
  editButton.textContent = isEditing ? "Submit" : "Edit";
  const inputs = document.querySelectorAll(".profile-info input");
  const removeButtons = document.querySelectorAll(".remove-crush-button");
  inputs.forEach(input => input.disabled = !isEditing);
  removeButtons.forEach(button => button.disabled = !isEditing);
  addCrushButton.disabled = !isEditing || crushCount >= 3;

  if (!isEditing) {
    if (hasEmptyCrushInputs()) {
      alert('Please fill in all crush email inputs before submitting.');
      editButton.textContent = "Submit"; // Revert button text back to "Submit"
      inputs.forEach(input => input.disabled = false); // Keep inputs editable
      removeButtons.forEach(button => button.disabled = false); // Keep remove buttons enabled
      addCrushButton.disabled = crushCount >= 3; // Ensure add button state remains correct
      return; // Exit the function early to prevent submission
    }

    const crushes = Array.from(crushContainer.querySelectorAll('input'))
      .map(input => input.value.toLowerCase())
      .filter(value => value !== '');

    alert('Info Submitted');
    
    await setDoc(doc(db, userDomain, userUID), {
      name: document.getElementById('nameInput').value,
      crushes: crushes,
      emailedCrushes: emailedCrushes
    }, { merge: true });
    
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
  }
});

function hasEmptyCrushInputs() {
  const crushInputs = document.querySelectorAll('.crushemail-input');
  for (const input of crushInputs) {
    if (input.value.trim() === '') {
      return true;
    }
  }
  return false;
}

addCrushButton.addEventListener('click', () => {
  if (crushCount < 3) {
    addCrushInput('', crushCount + 1);
  }
});

document.getElementById("deleteButton").addEventListener("click", async function() {
  const accepted = confirm('Are you sure you want to delete your account? This will delete your presence from the platform.');
  if(accepted){
    try {
      await deleteDoc(doc(db, userDomain, userUID));
      await deleteUser(userObject);
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

function addNotification(crushName) {
  const notificationBox = document.getElementById('notificationBox');
  const notification = document.createElement('div');
  notification.classList.add('notification');
  notification.textContent = "You have matched with: " + crushName;

  notification.addEventListener('click', async function() {
  const messagesList = document.getElementById('messagesList');
  messagesList.scrollTop = messagesList.scrollHeight;
    await showConversation(crushName);
  });

  notificationBox.appendChild(notification);
}


async function getConversations() {
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, where('user_uids', 'array-contains', userUID));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    const conversationData = doc.data();
    let crush;
    if(conversationData.user_names[0] !== document.getElementById('nameInput').value){
      crush = conversationData.user_names[1];
    } else{
      crush = conversationData.user_names[0];
    }
    convoMap.set(crush, doc.id);
  });
}

// Update the showConversation function to generate message elements with the new structure
async function showConversation(crushName) {
  const messagesList = document.getElementById('messagesList');
  messagesList.innerHTML = '';

  const convoId = convoMap.get(crushName);

  if (convoId) {
    const messagesRef = collection(db, 'conversations', convoId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);

    let lastSender = null;

    messagesSnapshot.forEach((doc, index) => {
      const messageData = doc.data();
      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      const isSender = messageData.sender === userUID;
      const currentSender = isSender ? 'You' : crushName;

      if (isSender) {
        messageElement.classList.add('sender');
      } else {
        messageElement.classList.add('receiver');
      }

      if (lastSender !== currentSender || index === 0) {
        const nameElement = document.createElement('div');
        nameElement.classList.add('message-name');
        nameElement.textContent = currentSender;
        messageElement.appendChild(nameElement);
      }

      const bubbleElement = document.createElement('div');
      bubbleElement.classList.add('message-bubble');
      bubbleElement.textContent = messageData.text;

      messageElement.appendChild(bubbleElement);
      messagesList.appendChild(messageElement);

      lastSender = currentSender;
    });
    
    
    const sendMessageButton = document.getElementById('sendMessageButton');
    const messageInput = document.getElementById('messageInput');

    messageInput.addEventListener('keypress', async (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        await sendMessage(convoId, crushName);
      }
    });
    
    sendMessageButton.onclick = async () => {
      await sendMessage();
    };
    
    async function sendMessage() {
      const newMessage = messageInput.value;
      if (newMessage) {
        const messageRef = doc(collection(db, 'conversations', convoId, 'messages'));
        await setDoc(messageRef, {
          sender: userUID,
          text: newMessage,
          timestamp: new Date()
        });

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'sender');

        if (lastSender !== 'You') {
          const nameElement = document.createElement('div');
          nameElement.classList.add('message-name');
          nameElement.textContent = 'You';
          messageElement.appendChild(nameElement);
        }

        const bubbleElement = document.createElement('div');
        bubbleElement.classList.add('message-bubble');
        bubbleElement.textContent = newMessage;

        messageElement.appendChild(bubbleElement);
        messagesList.appendChild(messageElement);

        messageInput.value = '';

        lastSender = 'You';
        messagesList.scrollTop = messagesList.scrollHeight;
      }
    }
  } else {
    messagesList.textContent = 'No conversation found.';
  }

  const messageModal = document.getElementById('messageModal');
  messageModal.style.display = "block";
  const conversationHeading = messageModal.querySelector('.conversation-heading');
  conversationHeading.textContent = `Conversation with: ${crushName}`;
  
  messagesList.scrollTop = messagesList.scrollHeight;

}

getConversations();



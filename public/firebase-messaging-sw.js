importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "AIzaSyD71J-ls8zmAN2XoQL7yvt_p0avhQmTUUI",
  authDomain: "groupement-ille.firebaseapp.com",
  projectId: "groupement-ille",
  storageBucket: "groupement-ille.firebasestorage.app",
  messagingSenderId: "119234243621",
  appId: "1:119234243621:web:efc139f29a664934ee23cc"
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
  })
})

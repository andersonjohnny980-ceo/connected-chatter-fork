/* =========================================================
   XChat native bridge (Capacitor)
   Loaded on web too, where it does nothing. Inside the Android app it
   wires real connectivity, notifications, back button, status bar,
   splash and keyboard to the interfaces the app already expects
   (window.XChatNative / window.XChatNetwork).
   ========================================================= */
(function () {
  var C = window.Capacitor;
  if (!C || typeof C.isNativePlatform !== 'function' || !C.isNativePlatform()) return;
  var P = C.Plugins || {};
  document.documentElement.classList.add('is-native');

  /* ---- connectivity: the OS is the source of truth, never a browser guess ---- */
  var lastOnline = null;
  function pushNet(on) {
    lastOnline = !!on;
    try {
      if (window.XChatNetwork && window.XChatNetwork.setOnline) window.XChatNetwork.setOnline(lastOnline);
      else setTimeout(function () { pushNet(lastOnline); }, 300);
    } catch (e) {}
    try {
      window.dispatchEvent(new Event(lastOnline ? 'online' : 'offline'));
    } catch (e) {}
  }
  if (P.Network) {
    P.Network.getStatus().then(function (s) { pushNet(s && s.connected); }).catch(function () {});
    P.Network.addListener('networkStatusChange', function (s) { pushNet(s && s.connected); });
  }

  /* ---- notifications ---- */
  var notifId = 1;
  function ensureNotifPermission() {
    if (!P.LocalNotifications) return Promise.resolve(false);
    return P.LocalNotifications.checkPermissions()
      .then(function (r) {
        if (r && r.display === 'granted') return true;
        return P.LocalNotifications.requestPermissions().then(function (x) {
          return !!(x && x.display === 'granted');
        });
      })
      .catch(function () { return false; });
  }

  /* ---- the interface the app already calls ---- */
  window.XChatNative = {
    platform: 'android',
    requestNotifications: function () { return ensureNotifPermission(); },
    notify: function (title, body, chatId) {
      ensureNotifPermission().then(function (ok) {
        if (!ok || !P.LocalNotifications) return;
        P.LocalNotifications.schedule({
          notifications: [{
            id: (notifId = (notifId % 2000) + 1),
            title: String(title || 'XChat'),
            body: String(body || 'New message'),
            smallIcon: 'ic_stat_icon',
            group: 'xchat',
            channelId: 'xchat_messages',
            extra: { chatId: chatId || '' }
          }]
        }).catch(function () {});
      });
      return true;
    },
    /* A WebView never raises the Android microphone dialog on its own. The
       native host (MainActivity) asks the OS, and we wait for the answer before
       getUserMedia is allowed to run — otherwise the call fails silently. */
    requestMicrophone: function () {
      var A = window.XChatAndroid;
      if (!A || typeof A.micGranted !== 'function') return Promise.resolve(true);
      try {
        if (A.micGranted()) return Promise.resolve(true);
        A.requestMic();
      } catch (e) { return Promise.resolve(true); }
      // Poll while the OS dialog is on screen (max ~30s), then report the answer.
      return new Promise(function (resolve) {
        var tries = 0;
        var t = setInterval(function () {
          var ok = false;
          try { ok = A.micGranted(); } catch (e) {}
          if (ok) { clearInterval(t); resolve(true); return; }
          if (++tries > 300) { clearInterval(t); resolve('denied'); }
        }, 100);
      });
    },
    requestPermission: function () { return Promise.resolve(true); },
    vibrate: function (ms) {
      if (P.Haptics) P.Haptics.vibrate({ duration: ms || 20 }).catch(function () {});
    },
    /* Never kill the process on back: park it like WhatsApp does. */
    exitApp: function () { if (P.App) P.App.minimizeApp().catch(function () {}); }
  };

  if (P.LocalNotifications) {
    P.LocalNotifications.addListener('localNotificationActionPerformed', function (ev) {
      var id = ev && ev.notification && ev.notification.extra && ev.notification.extra.chatId;
      if (id) window.dispatchEvent(new CustomEvent('xchat-open-chat', { detail: { chatId: id } }));
    });
  }

  /* ---- hardware back button: walk the app's own history, then minimise ---- */
  if (P.App) {
    P.App.addListener('backButton', function () {
      var sheet = document.querySelector('.sheet, .pview, .viewer, .modal');
      if (sheet) { history.back(); return; }
      if (window.history.length > 1) history.back();
      else P.App.minimizeApp().catch(function () {});
    });
    P.App.addListener('appStateChange', function (s) {
      if (s && s.isActive) document.dispatchEvent(new Event('visibilitychange'));
    });
  }

  /* ---- chrome ---- */
  if (P.StatusBar) {
    P.StatusBar.setOverlaysWebView({ overlay: false }).catch(function () {});
    P.StatusBar.setStyle({ style: 'LIGHT' }).catch(function () {});
    P.StatusBar.setBackgroundColor({ color: '#0b1017' }).catch(function () {});
  }
  if (P.Keyboard) {
    P.Keyboard.setScroll({ isDisabled: true }).catch(function () {});
    P.Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(function () {});
  }
  /* ---- push notifications (FCM) ----
     One pipeline only: FCM delivers while the app is backgrounded or closed,
     LocalNotifications covers the foreground. Every payload carries a msgId so
     the same message is never shown twice, and a tap always opens this app. */
  var seen = Object.create(null);
  function firstTime(key) {
    if (!key) return true;
    if (seen[key]) return false;
    seen[key] = 1;
    var keys = Object.keys(seen);
    if (keys.length > 200) delete seen[keys[0]];
    return true;
  }
  function openFromPayload(data) {
    var id = data && (data.chatId || data.chat_id);
    if (id) window.dispatchEvent(new CustomEvent('xchat-open-chat', { detail: { chatId: id } }));
  }
  var PN = P.PushNotifications;
  if (PN) {
    PN.addListener('registration', function (t) {
      var token = t && t.value;
      if (!token) return;
      window.XChatPushToken = token;
      window.dispatchEvent(new CustomEvent('xchat-push-token', { detail: { token: token } }));
    });
    PN.addListener('registrationError', function (e) {
      try { console.warn('push registration failed', e); } catch (_) {}
    });
    // Arrived while the app is open: FCM shows nothing, so we do.
    PN.addListener('pushNotificationReceived', function (n) {
      var data = (n && n.data) || {};
      if (!firstTime(data.msgId || data.messageId)) return;
      if (document.visibilityState === 'visible' && data.chatId && window.XChatActiveChat === data.chatId) return;
      window.XChatNative.notify(
        (n && n.title) || (data.title) || 'XChat',
        (n && n.body) || (data.body) || 'New message',
        data.chatId || data.chat_id || ''
      );
    });
    // Tapped from the notification shade: open the chat inside the app.
    PN.addListener('pushNotificationActionPerformed', function (ev) {
      openFromPayload(ev && ev.notification && ev.notification.data);
    });
    // High-importance channel with sound + vibration. Closed-app pushes land
    // here too (it is the manifest default), so phones on vibrate still buzz.
    var CH = { id: 'xchat_messages', name: 'Messages', description: 'New chat messages',
      importance: 5, visibility: 1, vibration: true, lights: true, lightColor: '#2F7CF6', sound: 'default' };
    PN.createChannel(CH).catch(function () {});
    if (P.LocalNotifications && P.LocalNotifications.createChannel) P.LocalNotifications.createChannel(CH).catch(function () {});
    window.XChatNative.registerPush = function () {
      return PN.checkPermissions()
        .then(function (r) {
          if (r && r.receive === 'granted') return r;
          return PN.requestPermissions();
        })
        .then(function (r) {
          if (!r || r.receive !== 'granted') return false;
          return PN.register().then(function () { return true; });
        })
        .catch(function () { return false; });
    };
  } else {
    window.XChatNative.registerPush = function () { return Promise.resolve(false); };
  }

  /* ---- splash: hold the native splash until the web UI has actually painted,
     so there is never a blank white frame between the two. ---- */
  var splashGone = false;
  function hideSplash() {
    if (splashGone) return;
    splashGone = true;
    if (P.SplashScreen) P.SplashScreen.hide({ fadeOutDuration: 0 }).catch(function () {});
  }
  hideSplash(); // X-Chat's own animated splash is already in the page
  window.addEventListener('xchat-ui-ready', hideSplash);
  function whenPainted() {
    requestAnimationFrame(function () { requestAnimationFrame(hideSplash); });
  }
  if (document.readyState === 'complete') whenPainted();
  else window.addEventListener('load', whenPainted);
  setTimeout(hideSplash, 4000); // hard safety net
})();

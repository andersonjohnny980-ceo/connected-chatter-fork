package com.horizon.xchat;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

/**
 * XChat Android host.
 *
 * Capacitor's own WebChromeClient already answers the WebView's
 * onPermissionRequest for AUDIO_CAPTURE, so we deliberately leave it in place
 * (replacing it would break the file chooser used for photos and videos).
 *
 * What it does not do is ask Android for RECORD_AUDIO before the first call, so
 * the very first getUserMedia() would fail with no dialog the user could act on.
 * We request it (and notifications on Android 13+) at launch, and expose a tiny
 * JS bridge so the web layer can re-ask right before a call.
 */
public class MainActivity extends BridgeActivity {

    private static final int REQ_PERMS = 9301;

    /** Exposed to JS as window.XChatAndroid — see public/native-bridge.js. */
    public class MicBridge {

        @JavascriptInterface
        public boolean micGranted() {
            return ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED;
        }

        @JavascriptInterface
        public void requestMic() {
            runOnUiThread(() -> {
                if (!micGranted()) {
                    ActivityCompat.requestPermissions(
                        MainActivity.this,
                        new String[] { Manifest.permission.RECORD_AUDIO, Manifest.permission.MODIFY_AUDIO_SETTINGS },
                        REQ_PERMS
                    );
                }
            });
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new MicBridge(), "XChatAndroid");
        }
        requestStartupPermissions();
    }

    private void requestStartupPermissions() {
        List<String> wanted = new ArrayList<>();
        if (
            ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED
        ) {
            wanted.add(Manifest.permission.RECORD_AUDIO);
        }
        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) !=
            PackageManager.PERMISSION_GRANTED
        ) {
            wanted.add(Manifest.permission.POST_NOTIFICATIONS);
        }
        if (!wanted.isEmpty()) {
            ActivityCompat.requestPermissions(this, wanted.toArray(new String[0]), REQ_PERMS);
        }
    }
}

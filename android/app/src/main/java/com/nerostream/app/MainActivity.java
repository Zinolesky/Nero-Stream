package com.nerostream.app;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.media.AudioManager;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.os.SystemClock;
import android.util.Log;
import android.view.GestureDetector;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import java.util.Collections;
import java.util.HashSet;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "NeroStreamGuards";

    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    // VLC-Style Gesture State
    private GestureDetector gestureDetector;
    private boolean isPlayerActive = false;
    private boolean isFullscreenMode = false;
    private boolean isSimulatingTouch = false;
    private int videoLeft = 0;
    private int videoTop = 0;
    private int videoRight = 0;
    private int videoBottom = 0;

    private float volumeAccumulator = 0f;
    private float currentBrightness = 0.6f;
    private static final float VOLUME_SCROLL_STEP = 32f; // Pixels per volume notch
    private AudioManager audioManager;

    /**
     * Native Hardware Media Bridge
     * Gives webview direct control over real Android hardware volume and screen brightness
     */
    public class NativeMediaBridge {
        private final Activity activity;

        public NativeMediaBridge(Activity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void setPlayerActive(boolean active) {
            isPlayerActive = active;
            Log.d(TAG, "Native player active state: " + active);
            if (active && audioManager != null) {
                int curVol = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
                int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                if (curVol == 0 && maxVol > 0) {
                    audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, maxVol, 0);
                }
            }
        }

        @JavascriptInterface
        public void setVideoBounds(int l, int t, int r, int b, boolean fullscreen) {
            videoLeft = l;
            videoTop = t;
            videoRight = r;
            videoBottom = b;
            isFullscreenMode = fullscreen;
            isPlayerActive = true;
            Log.d(TAG, "Video bounds set: (" + l + ", " + t + ") to (" + r + ", " + b + "), fullscreen=" + fullscreen);
        }

        @JavascriptInterface
        public void adjustVolume(int direction) {
            if (audioManager != null) {
                int dir = direction > 0 ? AudioManager.ADJUST_RAISE : AudioManager.ADJUST_LOWER;
                audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, dir, 0);
                Log.d(TAG, "Hardware volume adjusted: " + (direction > 0 ? "UP" : "DOWN"));
            }
        }

        @JavascriptInterface
        public void setVolume(int percentage) {
            if (audioManager != null) {
                int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                int targetVol = Math.round((Math.max(0, Math.min(100, percentage)) / 100.0f) * maxVol);
                audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, targetVol, 0);
                Log.d(TAG, "Hardware volume set to: " + targetVol + "/" + maxVol);
            }
        }

        @JavascriptInterface
        public int getVolume() {
            if (audioManager != null) {
                int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                int currentVol = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
                return maxVol > 0 ? Math.round(((float) currentVol / maxVol) * 100) : 50;
            }
            return 50;
        }

        @JavascriptInterface
        public void setScreenBrightness(float brightness) {
            activity.runOnUiThread(() -> {
                try {
                    currentBrightness = Math.max(0.05f, Math.min(1.0f, brightness));
                    WindowManager.LayoutParams lp = activity.getWindow().getAttributes();
                    lp.screenBrightness = currentBrightness;
                    activity.getWindow().setAttributes(lp);
                    Log.d(TAG, "Hardware screen brightness set to: " + currentBrightness);
                } catch (Exception e) {
                    Log.w(TAG, "Failed to set screen brightness: " + e.getMessage());
                }
            });
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        initGestureDetector();
    }

    private void initGestureDetector() {
        gestureDetector = new GestureDetector(this, new GestureDetector.SimpleOnGestureListener() {
            @Override
            public boolean onDoubleTap(MotionEvent e) {
                if (!isPlayerActive) return false;

                int vWidth = isFullscreenMode ? getWindow().getDecorView().getWidth() : Math.max(1, videoRight - videoLeft);
                int vHeight = isFullscreenMode ? getWindow().getDecorView().getHeight() : Math.max(1, videoBottom - videoTop);
                float relX = isFullscreenMode ? e.getX() : (e.getX() - videoLeft);
                float relY = isFullscreenMode ? e.getY() : (e.getY() - videoTop);

                // Pass bottom 22% (timeline scrubber, audio, subtitles) straight to player
                if (relY > vHeight * 0.78f) {
                    return false;
                }

                if (relX < vWidth * 0.35f) {
                    // Double tap LEFT: Rewind 10s
                    Log.d(TAG, "VLC Gesture: Double-tap Left (-10s)");
                    triggerSeek(-10);
                    return true; // Consumes event so iframe never receives dblclick
                } else if (relX > vWidth * 0.65f) {
                    // Double tap RIGHT: Skip 10s
                    Log.d(TAG, "VLC Gesture: Double-tap Right (+10s)");
                    triggerSeek(10);
                    return true; // Consumes event
                } else {
                    // Double tap CENTER: Toggle Play / Pause!
                    Log.d(TAG, "VLC Gesture: Double-tap Center (Play/Pause)");
                    triggerPlayPause();
                    return true; // Consumes event, completely preventing fullscreen toggle!
                }
            }

            @Override
            public boolean onDoubleTapEvent(MotionEvent e) {
                return isPlayerActive; // Consume all motion events related to double tap
            }

            @Override
            public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
                if (!isPlayerActive || e1 == null || e2 == null) return false;

                int vWidth = isFullscreenMode ? getWindow().getDecorView().getWidth() : Math.max(1, videoRight - videoLeft);
                int vHeight = isFullscreenMode ? getWindow().getDecorView().getHeight() : Math.max(1, videoBottom - videoTop);
                float relY = isFullscreenMode ? e1.getY() : (e1.getY() - videoTop);

                // Pass bottom 22% straight through to timeline scrubber
                if (relY > vHeight * 0.78f) {
                    return false;
                }

                // Only intercept vertical gestures (VLC style)
                if (Math.abs(distanceY) > Math.abs(distanceX) * 1.15f) {
                    float relX = isFullscreenMode ? e1.getX() : (e1.getX() - videoLeft);

                    if (relX < vWidth * 0.5f) {
                        // LEFT SIDE: Brightness
                        handleBrightnessScroll(distanceY);
                        return true;
                    } else {
                        // RIGHT SIDE: Real Hardware Volume
                        handleVolumeScroll(distanceY);
                        return true;
                    }
                }
                return false;
            }
        });
    }

    private void handleVolumeScroll(float distanceY) {
        volumeAccumulator += distanceY;
        if (Math.abs(volumeAccumulator) >= VOLUME_SCROLL_STEP) {
            int direction = volumeAccumulator > 0 ? AudioManager.ADJUST_RAISE : AudioManager.ADJUST_LOWER;
            if (audioManager != null) {
                // Adjust volume silently in hardware without triggering the OS volume popup (FLAG = 0)
                audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, 0);

                int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                int curVol = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC);
                int percent = maxVol > 0 ? Math.round(((float) curVol / maxVol) * 100) : 50;

                runOnUiThread(() -> {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        getBridge().getWebView().evaluateJavascript(
                            "window.onNativeVolumeChanged && window.onNativeVolumeChanged(" + percent + ");",
                            null
                        );
                    }
                });
            }
            volumeAccumulator = 0;
        }
    }

    private void handleBrightnessScroll(float distanceY) {
        int height = isFullscreenMode ? getWindow().getDecorView().getHeight() : Math.max(1, videoBottom - videoTop);
        if (height <= 0) height = 1000;
        float step = (distanceY / (float) height) * 1.2f;
        currentBrightness = Math.max(0.05f, Math.min(1.0f, currentBrightness + step));

        runOnUiThread(() -> {
            try {
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.screenBrightness = currentBrightness;
                getWindow().setAttributes(lp);

                // Notify frontend to display VLC-style Sun HUD
                if (getBridge() != null && getBridge().getWebView() != null) {
                    int percent = Math.round(currentBrightness * 100);
                    getBridge().getWebView().evaluateJavascript(
                        "window.onNativeBrightnessChanged && window.onNativeBrightnessChanged(" + percent + ");",
                        null
                    );
                }
            } catch (Exception e) {
                Log.w(TAG, "Error updating brightness: " + e.getMessage());
            }
        });
    }

    private void triggerPlayPause() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            long now = SystemClock.uptimeMillis();

            // 1. Calculate exact center coordinates of the video box
            float cx = isFullscreenMode ? (webView.getWidth() / 2.0f) : ((videoLeft + videoRight) / 2.0f);
            float cy = isFullscreenMode ? (webView.getHeight() / 2.0f) : ((videoTop + videoBottom) / 2.0f);

            // 2. Dispatch simulated single tap at the video center (without triggering gesture loop)
            isSimulatingTouch = true;
            MotionEvent down = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, cx, cy, 0);
            MotionEvent up = MotionEvent.obtain(now, now + 35, MotionEvent.ACTION_UP, cx, cy, 0);
            webView.dispatchTouchEvent(down);
            webView.dispatchTouchEvent(up);
            down.recycle();
            up.recycle();
            isSimulatingTouch = false;

            // 3. Dispatch Spacebar Key Event
            webView.dispatchKeyEvent(new KeyEvent(now, now, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_SPACE, 0));
            webView.dispatchKeyEvent(new KeyEvent(now, now, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_SPACE, 0));

            // 4. Notify React to forward postMessage into iframe and trigger HUD
            webView.evaluateJavascript("window.onNativePlayPause && window.onNativePlayPause();", null);
        }
    }

    private void triggerSeek(int delta) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            long now = SystemClock.uptimeMillis();
            int vWidth = isFullscreenMode ? webView.getWidth() : Math.max(1, videoRight - videoLeft);
            int vHeight = isFullscreenMode ? webView.getHeight() : Math.max(1, videoBottom - videoTop);

            // 1. Click VidLink's native on-screen [-10] or [+10] skip button directly!
            // Left button is at ~33% width, 50% height; Right button is at ~67% width, 50% height
            float clickX = delta < 0
                ? (isFullscreenMode ? (vWidth * 0.33f) : (videoLeft + vWidth * 0.33f))
                : (isFullscreenMode ? (vWidth * 0.67f) : (videoLeft + vWidth * 0.67f));
            float clickY = isFullscreenMode ? (vHeight * 0.50f) : (videoTop + vHeight * 0.50f);

            isSimulatingTouch = true;
            MotionEvent down = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, clickX, clickY, 0);
            MotionEvent up = MotionEvent.obtain(now, now + 35, MotionEvent.ACTION_UP, clickX, clickY, 0);
            webView.dispatchTouchEvent(down);
            webView.dispatchTouchEvent(up);
            down.recycle();
            up.recycle();
            isSimulatingTouch = false;

            // 2. Dispatch Arrow Key Event (DPAD Left/Right)
            int keyCode = delta < 0 ? KeyEvent.KEYCODE_DPAD_LEFT : KeyEvent.KEYCODE_DPAD_RIGHT;
            webView.dispatchKeyEvent(new KeyEvent(now, now, KeyEvent.ACTION_DOWN, keyCode, 0));
            webView.dispatchKeyEvent(new KeyEvent(now, now, KeyEvent.ACTION_UP, keyCode, 0));

            // 3. Notify React to send postMessage and update HUD
            webView.evaluateJavascript("window.onNativeSeek && window.onNativeSeek(" + delta + ");", null);
        }
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (isSimulatingTouch) {
            return super.dispatchTouchEvent(ev);
        }

        // Restrict gestures ONLY to the video player area
        boolean isInsideVideo = false;
        if (isPlayerActive) {
            if (isFullscreenMode) {
                isInsideVideo = true;
            } else {
                float x = ev.getX();
                float y = ev.getY();
                if (x >= videoLeft && x <= videoRight && y >= videoTop && y <= videoBottom) {
                    isInsideVideo = true;
                }
            }
        }

        // Only intercept touches that occur directly over the video
        if (isInsideVideo && gestureDetector != null) {
            boolean handled = gestureDetector.onTouchEvent(ev);
            if (ev.getAction() == MotionEvent.ACTION_UP || ev.getAction() == MotionEvent.ACTION_CANCEL) {
                volumeAccumulator = 0;
            }
            if (handled) {
                return true;
            }
        }

        // All other touches (metadata, episodes, cast, buttons below video) pass straight through!
        return super.dispatchTouchEvent(ev);
    }

    @Override
    public void onStart() {
        super.onStart();
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                WebSettings settings = webView.getSettings();

                // Prevent iframes and ad scripts from spawning popups / secondary windows
                settings.setSupportMultipleWindows(false);
                settings.setJavaScriptCanOpenWindowsAutomatically(false);

                // Enable media playback without gesture gating
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setDomStorageEnabled(true);

                // Attach Hardware Volume & Brightness Bridge
                webView.addJavascriptInterface(new NativeMediaBridge(this), "AndroidMediaBridge");
                Log.i(TAG, "Attached AndroidMediaBridge to WebView.");

                // Inject cross-frame media controller script into all frames (including cross-origin iframes)
                try {
                    if (WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
                        String mediaScript = "(function() {" +
                            "function findVids() {" +
                            "    var list = Array.from(document.querySelectorAll('video'));" +
                            "    var ifrs = document.querySelectorAll('iframe');" +
                            "    ifrs.forEach(function(f) {" +
                            "        try { if (f.contentDocument) {" +
                            "            var sub = f.contentDocument.querySelectorAll('video');" +
                            "            sub.forEach(function(sv) { list.push(sv); });" +
                            "        }} catch(e){}" +
                            "    });" +
                            "    return list;" +
                            "}" +
                            "function forceFullVolume() {" +
                            "    var vids = findVids();" +
                            "    vids.forEach(function(v) {" +
                            "        try {" +
                            "            v.muted = false;" +
                            "            v.defaultMuted = false;" +
                            "            v.volume = 1.0;" +
                            "        } catch(e){}" +
                            "    });" +
                            "    var muteBtn = document.querySelector('button[data-plyr=\"mute\"].plyr__control--pressed, .vjs-mute-control.vjs-vol-0');" +
                            "    if (muteBtn) { try { muteBtn.click(); } catch(e){} }" +
                            "}" +
                            "function setControlsVisible(show) {" +
                            "    var controls = document.querySelectorAll('.plyr__controls, .vjs-control-bar, .controls, [class*=\"controls\"], [class*=\"player-controls\"], .jw-controls');" +
                            "    controls.forEach(function(c) {" +
                            "        c.style.transition = 'opacity 0.2s ease-in-out';" +
                            "        c.style.opacity = show ? '1' : '0';" +
                            "        c.style.pointerEvents = show ? 'auto' : 'none';" +
                            "    });" +
                            "    var player = document.querySelector('.plyr, .video-js, .jwplayer');" +
                            "    if (player) {" +
                            "        if (show) {" +
                            "            player.classList.remove('plyr--hide-controls');" +
                            "            player.classList.add('plyr--hover');" +
                            "        } else {" +
                            "            player.classList.add('plyr--hide-controls');" +
                            "            player.classList.remove('plyr--hover');" +
                            "        }" +
                            "    }" +
                            "}" +
                            "forceFullVolume();" +
                            "document.addEventListener('loadedmetadata', forceFullVolume, true);" +
                            "document.addEventListener('canplay', forceFullVolume, true);" +
                            "document.addEventListener('play', forceFullVolume, true);" +
                            "document.addEventListener('playing', forceFullVolume, true);" +
                            "document.addEventListener('volumechange', function(e) {" +
                            "    if (e.target && e.target.tagName === 'VIDEO' && e.target.muted && !e.target.__userExplicitMuted) {" +
                            "        e.target.muted = false;" +
                            "        e.target.volume = 1.0;" +
                            "    }" +
                            "}, true);" +
                            "var unMuteCount = 0;" +
                            "var unMuteInterval = setInterval(function() {" +
                            "    forceFullVolume();" +
                            "    unMuteCount++;" +
                            "    if (unMuteCount > 20) clearInterval(unMuteInterval);" +
                            "}, 200);" +
                            "window.addEventListener('message', function(ev) {" +
                            "    if (!ev.data) return;" +
                            "    var vids = findVids();" +
                            "    if (ev.data.type === 'NERO_UNMUTE') {" +
                            "        forceFullVolume();" +
                            "    } else if (ev.data.type === 'NERO_PLAY_PAUSE' || ev.data.type === 'TOGGLE_PLAY') {" +
                            "        if (vids.length > 0) {" +
                            "            vids.forEach(function(v) {" +
                            "                if (v.paused) {" +
                            "                    v.muted = false;" +
                            "                    v.volume = 1.0;" +
                            "                    v.play().catch(function(){});" +
                            "                    setControlsVisible(false);" +
                            "                } else {" +
                            "                    v.pause();" +
                            "                    setControlsVisible(true);" +
                            "                }" +
                            "            });" +
                            "        } else {" +
                            "            var btn = document.querySelector('button[data-plyr=\"play\"], .plyr__control--overlaid, .vjs-big-play-button, .vjs-play-control, [aria-label*=\"Play\" i], [aria-label*=\"Pause\" i], .play-btn, .play-button');" +
                            "            if (btn) btn.click();" +
                            "        }" +
                            "    } else if (ev.data.type === 'NERO_SEEK') {" +
                            "        var d = Number(ev.data.delta) || 0;" +
                            "        if (vids.length > 0) {" +
                            "            vids.forEach(function(v) {" +
                            "                var t = Math.max(0, (v.currentTime || 0) + d);" +
                            "                if (v.duration && !isNaN(v.duration)) t = Math.min(t, v.duration);" +
                            "                v.currentTime = t;" +
                            "            });" +
                            "        } else {" +
                            "            var btn = d < 0" +
                            "                ? document.querySelector('button[data-plyr=\"rewind\"], [aria-label*=\"rewind\" i], [aria-label*=\"10s\" i], .rewind-btn')" +
                            "                : document.querySelector('button[data-plyr=\"fast-forward\"], [aria-label*=\"forward\" i], [aria-label*=\"skip\" i], .forward-btn');" +
                            "            if (btn) btn.click();" +
                            "        }" +
                            "        setControlsVisible(true);" +
                            "        if (window.__neroSeekTimer) clearTimeout(window.__neroSeekTimer);" +
                            "        window.__neroSeekTimer = setTimeout(function() {" +
                            "            var isPlaying = vids.some(function(v) { return !v.paused; });" +
                            "            if (isPlaying) setControlsVisible(false);" +
                            "        }, 1000);" +
                            "    }" +
                            "    var childIfrs = document.querySelectorAll('iframe');" +
                            "    for (var i = 0; i < childIfrs.length; i++) {" +
                            "        try { childIfrs[i].contentWindow.postMessage(ev.data, '*'); } catch(err){}" +
                            "    }" +
                            "});" +
                            "})();";

                        WebViewCompat.addDocumentStartJavaScript(
                            webView,
                            mediaScript,
                            new HashSet<>(Collections.singletonList("*"))
                        );
                        Log.i(TAG, "Injected cross-frame media script via WebViewCompat.");
                    }
                } catch (Exception scriptEx) {
                    Log.w(TAG, "Could not inject cross-frame script: " + scriptEx.getMessage());
                }

                // Configure WebChromeClient with popup blocking AND native Fullscreen Landscape handling
                webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                    @Override
                    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                        Log.w(TAG, "Suppressed onCreateWindow popup request");
                        return false; // Blocks opening new windows/popups
                    }

                    @Override
                    public void onShowCustomView(View view, WebChromeClient.CustomViewCallback callback) {
                        if (customView != null) {
                            onHideCustomView();
                            return;
                        }

                        customView = view;
                        customViewCallback = callback;
                        isFullscreenMode = true;

                        // Rotate to Landscape for optimal full-screen viewing
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);

                        // Immersive sticky fullscreen hiding status and navigation bars
                        getWindow().getDecorView().setSystemUiVisibility(
                            View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        );

                        // Attach full screen video view
                        ViewGroup decor = (ViewGroup) getWindow().getDecorView();
                        decor.addView(customView, new ViewGroup.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT
                        ));
                    }

                    @Override
                    public void onHideCustomView() {
                        if (customView == null) return;
                        isFullscreenMode = false;

                        // Restore orientation and system bars
                        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);

                        ViewGroup decor = (ViewGroup) getWindow().getDecorView();
                        decor.removeView(customView);
                        customView = null;

                        if (customViewCallback != null) {
                            customViewCallback.onCustomViewHidden();
                            customViewCallback = null;
                        }
                    }
                });

                // Override WebViewClient to prevent ANY ad network from launching the system browser
                getBridge().setWebViewClient(new BridgeWebViewClient(getBridge()) {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        if (request != null && request.getUrl() != null) {
                            Uri uri = request.getUrl();
                            String host = uri.getHost();

                            if (host == null) return false;

                            // Allow local app content
                            if (host.equals("localhost") || host.equals("127.0.0.1")) {
                                return false;
                            }

                            // Allow legitimate streaming providers and TMDB
                            if (host.contains("vidlink.pro") ||
                                host.contains("vidsrc.to") ||
                                host.contains("vidsrc.pm") ||
                                host.contains("vidsrc.sh") ||
                                host.contains("multiembed.mov") ||
                                host.contains("2embed.cc") ||
                                host.contains("themoviedb.org") ||
                                host.contains("tmdb.org")) {
                                return false;
                            }

                            // BLOCK all other external ad URLs (ay267.com, etc.)
                            Log.w(TAG, "BLOCKED external ad redirect: " + uri.toString());
                            return true; // Return true = handled/dropped. NEVER opens Chrome!
                        }
                        return true;
                    }
                });

                Log.i(TAG, "Native anti-redirect and anti-popup guards successfully attached.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error configuring WebView guards", e);
        }
    }
}

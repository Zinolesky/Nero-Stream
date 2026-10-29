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
        }

        @JavascriptInterface
        public void adjustVolume(int direction) {
            if (audioManager != null) {
                int dir = direction > 0 ? AudioManager.ADJUST_RAISE : AudioManager.ADJUST_LOWER;
                audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, dir, AudioManager.FLAG_SHOW_UI);
                Log.d(TAG, "Hardware volume adjusted: " + (direction > 0 ? "UP" : "DOWN"));
            }
        }

        @JavascriptInterface
        public void setVolume(int percentage) {
            if (audioManager != null) {
                int maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
                int targetVol = Math.round((Math.max(0, Math.min(100, percentage)) / 100.0f) * maxVol);
                audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, targetVol, AudioManager.FLAG_SHOW_UI);
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

                int screenHeight = getWindow().getDecorView().getHeight();
                // Pass bottom 22% (control bar with scrubber/buttons) straight to player
                if (screenHeight > 0 && e.getY() > screenHeight * 0.78f) {
                    return false;
                }

                int screenWidth = getWindow().getDecorView().getWidth();
                float x = e.getX();

                if (x < screenWidth * 0.35f) {
                    // Double tap LEFT: Rewind 10s
                    Log.d(TAG, "VLC Gesture: Double-tap Left (-10s)");
                    triggerSeek(-10);
                    return true; // Consumes event! Prevents iframe from receiving dblclick & toggling fullscreen
                } else if (x > screenWidth * 0.65f) {
                    // Double tap RIGHT: Skip 10s
                    Log.d(TAG, "VLC Gesture: Double-tap Right (+10s)");
                    triggerSeek(10);
                    return true; // Consumes event!
                } else {
                    // Double tap CENTER: Toggle Play / Pause!
                    Log.d(TAG, "VLC Gesture: Double-tap Center (Play/Pause)");
                    triggerPlayPause();
                    return true; // Consumes event! VidLink will NEVER toggle fullscreen on double-tap!
                }
            }

            @Override
            public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX, float distanceY) {
                if (!isPlayerActive || e1 == null || e2 == null) return false;

                int screenHeight = getWindow().getDecorView().getHeight();
                // Pass bottom 22% straight through to timeline scrubber
                if (screenHeight > 0 && e1.getY() > screenHeight * 0.78f) {
                    return false;
                }

                // Only intercept vertical gestures (VLC style)
                if (Math.abs(distanceY) > Math.abs(distanceX) * 1.15f) {
                    int screenWidth = getWindow().getDecorView().getWidth();
                    float startX = e1.getX();

                    if (startX < screenWidth * 0.5f) {
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
                audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, AudioManager.FLAG_SHOW_UI);
            }
            volumeAccumulator = 0;
        }
    }

    private void handleBrightnessScroll(float distanceY) {
        int height = getWindow().getDecorView().getHeight();
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

            // 1. Dispatch Spacebar Key Event
            webView.dispatchKeyEvent(new KeyEvent(now, now, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_SPACE, 0));
            webView.dispatchKeyEvent(new KeyEvent(now, now, KeyEvent.ACTION_UP, KeyEvent.KEYCODE_SPACE, 0));

            // 2. Dispatch simulated single tap at center of screen to toggle Play/Pause natively
            int w = webView.getWidth();
            int h = webView.getHeight();
            float cx = w / 2.0f;
            float cy = h / 2.0f;
            MotionEvent down = MotionEvent.obtain(now, now, MotionEvent.ACTION_DOWN, cx, cy, 0);
            MotionEvent up = MotionEvent.obtain(now, now + 40, MotionEvent.ACTION_UP, cx, cy, 0);
            webView.dispatchTouchEvent(down);
            webView.dispatchTouchEvent(up);
            down.recycle();
            up.recycle();

            // 3. Notify React HUD
            webView.evaluateJavascript("window.onNativePlayPause && window.onNativePlayPause();", null);
        }
    }

    private void triggerSeek(int delta) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            long now = SystemClock.uptimeMillis();
            int keyCode = delta < 0 ? KeyEvent.KEYCODE_DPAD_LEFT : KeyEvent.KEYCODE_DPAD_RIGHT;

            // Dispatch Arrow Key Event
            webView.dispatchKeyEvent(new KeyEvent(now, now, KeyEvent.ACTION_DOWN, keyCode, 0));
            webView.dispatchKeyEvent(new KeyEvent(now, now, KeyEvent.ACTION_UP, keyCode, 0));

            // Notify React HUD
            webView.evaluateJavascript("window.onNativeSeek && window.onNativeSeek(" + delta + ");", null);
        }
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (isPlayerActive && gestureDetector != null) {
            boolean handled = gestureDetector.onTouchEvent(ev);
            if (ev.getAction() == MotionEvent.ACTION_UP || ev.getAction() == MotionEvent.ACTION_CANCEL) {
                volumeAccumulator = 0;
            }
            if (handled) {
                return true;
            }
        }
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

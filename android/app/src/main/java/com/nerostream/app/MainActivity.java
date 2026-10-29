package com.nerostream.app;

import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
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

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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

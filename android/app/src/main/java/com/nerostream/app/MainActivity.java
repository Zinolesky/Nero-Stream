package com.nerostream.app;

import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.util.Log;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "NeroStreamGuards";

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

                // Intercept any window.open() popup requests from iframe ads
                webView.setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                    @Override
                    public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                        Log.w(TAG, "Suppressed onCreateWindow popup request");
                        return false; // Blocks opening new windows/popups
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

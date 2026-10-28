package com.nerostream.app;

import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AdRedirectBlocker")
class AdRedirectBlockerPlugin extends Plugin {
    private static final String TAG = "AdRedirectBlocker";

    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        if (url == null) return false;
        String host = url.getHost();
        if (host == null) return false;

        // Allow internal local assets and app navigation
        if (host.equals("localhost") || host.equals("127.0.0.1")) {
            return false;
        }

        // Allow legitimate streaming providers and TMDB API/CDN
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

        // BLOCK any rogue ad networks, redirects, or pop-unders from launching Chrome
        // Returning true informs Capacitor that the intent is handled, dropping the URL
        Log.i(TAG, "Suppressed external ad redirect intent: " + url.toString());
        return true;
    }
}

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AdRedirectBlockerPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                WebSettings settings = webView.getSettings();

                // Prevent iframe ad scripts from spawning popups or secondary windows
                settings.setSupportMultipleWindows(false);
                settings.setJavaScriptCanOpenWindowsAutomatically(false);

                // Ensure smooth video playback permissions
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setDomStorageEnabled(true);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

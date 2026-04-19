package com.stratos.agencyos;

import android.os.Bundle;
import android.webkit.WebStorage;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // NATIVE CACHE OBLITERATION
        // This runs before the WebView loads the first page, ensured a clean slate.
        try {
            // 1. Wipe all local storage and service worker data
            WebStorage.getInstance().deleteAllData();
            
            // 2. Force the WebView to ignore cached files
            WebView webView = new WebView(this);
            webView.clearCache(true);
            webView.destroy();
            
            android.util.Log.d("StratOS", "NATIVE WIPE COMPLETED: Caches and WebStorage cleared.");
        } catch (Exception e) {
            android.util.Log.e("StratOS", "NATIVE WIPE FAILED: " + e.getMessage());
        }
    }
}

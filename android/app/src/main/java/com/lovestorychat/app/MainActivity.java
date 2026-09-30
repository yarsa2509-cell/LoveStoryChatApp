package com.lovestorychat.app;

import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        if (intent == null || intent.getData() == null) {
            return;
        }

        String url = intent.getData().toString();

        if (url.startsWith("lovestorychat://auth")) {
            getBridge().getWebView().evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('loveStoryAuthCallback',{detail:{url:" +
                org.json.JSONObject.quote(url) +
                "}}));",
                null
            );
        }
    }
}

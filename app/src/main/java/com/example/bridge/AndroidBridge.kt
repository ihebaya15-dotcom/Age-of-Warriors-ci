package com.example.bridge

import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import com.example.storage.GameStorage

class AndroidBridge(
    private val storage: GameStorage,
    private val onRewardedAdRequested: (placement: String) -> Unit,
    private val onHapticRequested: (durationMs: Long) -> Unit,
    private val onSoundChanged: (enabled: Boolean) -> Unit
) {
    private val mainHandler = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun getGameState(): String {
        return storage.loadGameState()
    }

    @JavascriptInterface
    fun saveGameState(json: String): Boolean {
        return storage.saveGameState(json)
    }

    @JavascriptInterface
    fun triggerRewardedAd(placement: String) {
        mainHandler.post {
            onRewardedAdRequested(placement)
        }
    }

    @JavascriptInterface
    fun performHaptic(durationMs: Long) {
        mainHandler.post {
            onHapticRequested(durationMs)
        }
    }

    @JavascriptInterface
    fun notifySoundChanged(enabled: Boolean) {
        mainHandler.post {
            onSoundChanged(enabled)
        }
    }
}

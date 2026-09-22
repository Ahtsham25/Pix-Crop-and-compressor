package com.example.ads

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

object AdConstants {
    const val TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713"
    const val TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111"
    const val TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712"
    const val TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917"
    const val TEST_NATIVE_ID = "ca-app-pub-3940256099942544/2247696110"
}

enum class AdType {
    BANNER, NATIVE, INTERSTITIAL, REWARDED
}

class AdManager {
    var compressionCount by mutableIntStateOf(0)
        private set

    private val _isRewardedAdActive = MutableStateFlow(false)
    val isRewardedAdActive: StateFlow<Boolean> = _isRewardedAdActive.asStateFlow()

    private val _isInterstitialAdActive = MutableStateFlow(false)
    val isInterstitialAdActive: StateFlow<Boolean> = _isInterstitialAdActive.asStateFlow()

    private var onRewardEarnedCallback: (() -> Unit)? = null
    private var onInterstitialDismissedCallback: (() -> Unit)? = null

    fun onCompressionPerformed(): Boolean {
        compressionCount++
        // As requested by user: on second and subsequent operations, trigger interstitial ad
        if (compressionCount >= 2 && compressionCount % 2 == 0) {
            return true
        }
        return false
    }

    fun showRewardedAd(onEarned: () -> Unit) {
        onRewardEarnedCallback = onEarned
        _isRewardedAdActive.value = true
    }

    fun completeRewardedAd() {
        _isRewardedAdActive.value = false
        onRewardEarnedCallback?.invoke()
        onRewardEarnedCallback = null
    }

    fun cancelRewardedAd() {
        _isRewardedAdActive.value = false
        onRewardEarnedCallback = null
    }

    fun showInterstitialAd(onDismissed: () -> Unit = {}) {
        onInterstitialDismissedCallback = onDismissed
        _isInterstitialAdActive.value = true
    }

    fun dismissInterstitialAd() {
        _isInterstitialAdActive.value = false
        onInterstitialDismissedCallback?.invoke()
        onInterstitialDismissedCallback = null
    }
}

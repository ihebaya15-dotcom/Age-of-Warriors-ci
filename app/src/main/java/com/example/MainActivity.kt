package com.example

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.View
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.bridge.AndroidBridge
import com.example.storage.GameStorage
import com.example.ui.theme.MyApplicationTheme
import kotlinx.coroutines.delay

class MainActivity : ComponentActivity() {

    private lateinit var gameStorage: GameStorage
    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        gameStorage = GameStorage(applicationContext)

        setContent {
            MyApplicationTheme {
                GameScreen(
                    gameStorage = gameStorage,
                    onWebViewReady = { wv -> webView = wv },
                    onVibrate = { duration -> triggerHaptic(duration) }
                )
            }
        }
    }

    private fun triggerHaptic(durationMs: Long) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            vibrator?.let {
                if (it.hasVibrator()) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        it.vibrate(VibrationEffect.createOneShot(durationMs.coerceAtLeast(15), VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        it.vibrate(durationMs.coerceAtLeast(15))
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onDestroy() {
        webView?.let {
            it.stopLoading()
            it.destroy()
        }
        webView = null
        super.onDestroy()
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun GameScreen(
    gameStorage: GameStorage,
    onWebViewReady: (WebView) -> Unit,
    onVibrate: (Long) -> Unit
) {
    var activeAdPlacement by remember { mutableStateOf<String?>(null) }
    var localWebView by remember { mutableStateOf<WebView?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
    ) {
        AndroidView(
            modifier = Modifier
                .fillMaxSize()
                .testTag("game_webview"),
            factory = { ctx ->
                WebView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    setLayerType(View.LAYER_TYPE_HARDWARE, null)

                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        allowFileAccess = true
                        setSupportZoom(false)
                        builtInZoomControls = false
                        displayZoomControls = false
                        useWideViewPort = true
                        loadWithOverviewMode = true
                        mediaPlaybackRequiresUserGesture = false
                        cacheMode = WebSettings.LOAD_NO_CACHE
                    }

                    val bridge = AndroidBridge(
                        storage = gameStorage,
                        onRewardedAdRequested = { placement ->
                            activeAdPlacement = placement
                        },
                        onHapticRequested = { duration ->
                            onVibrate(duration)
                        },
                        onSoundChanged = { /* audio state handled internally */ }
                    )

                    addJavascriptInterface(bridge, "AndroidBridge")

                    webChromeClient = WebChromeClient()
                    webViewClient = object : WebViewClient() {
                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?
                        ) {
                            super.onReceivedError(view, request, error)
                        }
                    }

                    loadUrl("file:///android_asset/game/index.html")
                    localWebView = this
                    onWebViewReady(this)
                }
            }
        )

        // Native Rewarded Video Ad Simulation Overlay
        activeAdPlacement?.let { placement ->
            RewardedAdModal(
                placement = placement,
                onDismiss = {
                    activeAdPlacement = null
                },
                onRewardGranted = {
                    localWebView?.post {
                        localWebView?.evaluateJavascript("window.onRewardedAdSuccess('$placement');", null)
                    }
                    activeAdPlacement = null
                }
            )
        }
    }
}

@Composable
fun RewardedAdModal(
    placement: String,
    onDismiss: () -> Unit,
    onRewardGranted: () -> Unit
) {
    var secondsLeft by remember { mutableIntStateOf(5) }
    var rewardEarned by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        while (secondsLeft > 0) {
            delay(1000)
            secondsLeft -= 1
        }
        rewardEarned = true
    }

    val progress = (5 - secondsLeft) / 5f
    val animatedProgress by animateFloatAsState(targetValue = progress, label = "ad_progress")

    val placementTitle = when (placement) {
        "double_gold" -> "Double Battle Gold! (2X)"
        "emergency_food" -> "Instant Emergency Food (+25)"
        "dungeon_key" -> "Free Dungeon Challenge Key"
        else -> "Epic Battle Booster"
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.88f))
            .testTag("rewarded_ad_modal"),
        contentAlignment = Alignment.Center
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .clip(RoundedCornerShape(24.dp)),
            color = Color(0xFF1E293B),
            shadowElevation = 16.dp
        ) {
            Column(
                modifier = Modifier
                    .background(
                        Brush.verticalGradient(
                            listOf(Color(0xFF1E293B), Color(0xFF0F172A))
                        )
                    )
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header badge
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFF59E0B), RoundedCornerShape(8.dp))
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = "REWARD VIDEO AD",
                            color = Color.Black,
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }

                    if (rewardEarned) {
                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .size(36.dp)
                                .background(Color.White.copy(alpha = 0.1f), CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close Ad",
                                tint = Color.White
                            )
                        }
                    } else {
                        Text(
                            text = "Reward in: ${secondsLeft}s",
                            color = Color.LightGray,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Sponsor Graphic Card
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFF3B82F6), Color(0xFF8B5CF6))
                            )
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = "Reward Star",
                            tint = Color(0xFFFDE047),
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "WARRIORS LIVE OPS",
                            color = Color.White,
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 18.sp,
                            letterSpacing = 1.sp
                        )
                        Text(
                            text = "Supercharge Your Empire Army",
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(18.dp))

                Text(
                    text = placementTitle,
                    color = Color(0xFFFDE047),
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    textAlign = TextAlign.Center
                )

                Spacer(modifier = Modifier.height(12.dp))

                LinearProgressIndicator(
                    progress = { animatedProgress },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(8.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    color = Color(0xFF10B981),
                    trackColor = Color(0xFF334155),
                )

                Spacer(modifier = Modifier.height(22.dp))

                Button(
                    onClick = {
                        if (rewardEarned) {
                            onRewardGranted()
                        }
                    },
                    enabled = rewardEarned,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF10B981),
                        disabledContainerColor = Color(0xFF334155)
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .testTag("claim_reward_button")
                ) {
                    Icon(
                        imageVector = if (rewardEarned) Icons.Default.CardGiftcard else Icons.Default.PlayArrow,
                        contentDescription = null,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (rewardEarned) "CLAIM REWARD NOW!" else "Watching Ad ($secondsLeft)",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (rewardEarned) Color.White else Color.Gray
                    )
                }
            }
        }
    }
}

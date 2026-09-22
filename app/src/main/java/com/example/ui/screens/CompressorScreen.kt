package com.example.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ads.AdManager
import com.example.data.FileSaver
import com.example.data.ImageCompressor
import com.example.model.CompressionPreset
import com.example.model.CompressionResult
import com.example.model.ImageMetadata
import com.example.model.OutputFormat
import com.example.ui.components.BannerAdView
import com.example.ui.components.InterstitialAdDialog
import com.example.ui.components.NativeAdCard
import com.example.ui.components.RewardedAdDialog
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CompressorScreen(
    adManager: AdManager,
    onNavigateToPolicy: (String) -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val imageCompressor = remember { ImageCompressor(context) }
    val fileSaver = remember { FileSaver(context) }

    var selectedUri by remember { mutableStateOf<Uri?>(null) }
    var imageMetadata by remember { mutableStateOf<ImageMetadata?>(null) }
    var selectedPreset by remember { mutableStateOf(CompressionPreset.STANDARD) }
    var customQuality by remember { mutableIntStateOf(65) }
    var scalePercent by remember { mutableIntStateOf(100) }
    var selectedFormat by remember { mutableStateOf(OutputFormat.JPEG) }

    var isCompressing by remember { mutableStateOf(false) }
    var compressionResult by remember { mutableStateOf<CompressionResult?>(null) }
    var previewMode by remember { mutableStateOf("after") } // "before" or "after"
    var saveSuccessMessage by remember { mutableStateOf<String?>(null) }

    val isRewardedActive by adManager.isRewardedAdActive.collectAsState()
    val isInterstitialActive by adManager.isInterstitialAdActive.collectAsState()

    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.PickVisualMedia()
    ) { uri: Uri? ->
        if (uri != null) {
            // Check if we should trigger interstitial ad for second/subsequent actions as requested by user
            if (adManager.onCompressionPerformed()) {
                adManager.showInterstitialAd {
                    selectedUri = uri
                }
            } else {
                selectedUri = uri
            }
        }
    }

    // Trigger metadata load and auto compression when image or settings change
    LaunchedEffect(selectedUri) {
        selectedUri?.let { uri ->
            isCompressing = true
            imageMetadata = imageCompressor.getImageMetadata(uri)
            val result = imageCompressor.compressImage(
                uri = uri,
                preset = selectedPreset,
                customQuality = customQuality,
                format = selectedFormat,
                scalePercent = scalePercent
            )
            compressionResult = result
            isCompressing = false
        }
    }

    fun recompress() {
        val uri = selectedUri ?: return
        coroutineScope.launch {
            isCompressing = true
            compressionResult = imageCompressor.compressImage(
                uri = uri,
                preset = selectedPreset,
                customQuality = customQuality,
                format = selectedFormat,
                scalePercent = scalePercent
            )
            isCompressing = false
        }
    }

    Scaffold(
        bottomBar = {
            BannerAdView()
        },
        snackbarHost = {
            saveSuccessMessage?.let { msg ->
                Snackbar(
                    modifier = Modifier.padding(16.dp),
                    action = {
                        TextButton(onClick = { saveSuccessMessage = null }) {
                            Text("OK", color = MaterialTheme.colorScheme.inversePrimary)
                        }
                    }
                ) {
                    Text(msg)
                }
            }
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 8.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = "Image Compressor",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = "امیج کمپریسر اور کنورٹر",
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Medium
                    )
                }

                Row {
                    IconButton(onClick = { onNavigateToPolicy("privacy") }) {
                        Icon(Icons.Default.Security, contentDescription = "Privacy Policy")
                    }
                    IconButton(onClick = { onNavigateToPolicy("guide") }) {
                        Icon(Icons.Default.HelpOutline, contentDescription = "Guide")
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Image Picker / Preview Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                if (selectedUri == null) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = MaterialTheme.colorScheme.primaryContainer,
                            modifier = Modifier.size(64.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.Default.AddPhotoAlternate,
                                    contentDescription = "Select Photo",
                                    tint = MaterialTheme.colorScheme.primary,
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                        }
                        Spacer(modifier = Modifier.height(14.dp))
                        Text(
                            text = "Choose an image to compress",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                        Text(
                            text = "کوئی بھی تصویر منتخب کریں اور فوری سائز کم کریں",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(
                            onClick = {
                                photoPickerLauncher.launch(
                                    PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                )
                            },
                            shape = RoundedCornerShape(12.dp),
                            contentPadding = PaddingValues(horizontal = 24.dp, vertical = 12.dp)
                        ) {
                            Icon(Icons.Default.PhotoLibrary, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Select Image")
                        }
                    }
                } else {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = imageMetadata?.fileName ?: "Selected Image",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    maxLines = 1,
                                    modifier = Modifier.widthIn(max = 200.dp)
                                )
                            }
                            TextButton(
                                onClick = {
                                    photoPickerLauncher.launch(
                                        PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)
                                    )
                                }
                            ) {
                                Icon(Icons.Default.SwapHoriz, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Change", fontSize = 13.sp)
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        // Preview Image Box with Before/After toggle
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .background(Color.Black.copy(alpha = 0.05f)),
                            contentAlignment = Alignment.Center
                        ) {
                            if (compressionResult?.compressedBitmap != null) {
                                Image(
                                    bitmap = compressionResult!!.compressedBitmap!!.asImageBitmap(),
                                    contentDescription = "Compressed Preview",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Fit
                                )
                            } else {
                                CircularProgressIndicator()
                            }

                            // Watermark / Badge
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.85f),
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .padding(8.dp)
                            ) {
                                Text(
                                    text = if (isCompressing) "Compressing..." else "Live Preview",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }

            if (selectedUri != null) {
                Spacer(modifier = Modifier.height(16.dp))

                // Compression Results Stats Card
                compressionResult?.let { res ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.4f)
                        )
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Compression Results",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp
                                )
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = MaterialTheme.colorScheme.primary
                                ) {
                                    Text(
                                        text = "-${res.savingsPercentage}% Smaller",
                                        color = MaterialTheme.colorScheme.onPrimary,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.height(10.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceAround
                            ) {
                                StatItem(
                                    label = "Original",
                                    value = formatBytes(res.originalSizeBytes),
                                    subtitle = "${res.originalWidth}x${res.originalHeight}"
                                )
                                Divider(
                                    modifier = Modifier
                                        .height(40.dp)
                                        .width(1.dp)
                                )
                                StatItem(
                                    label = "Compressed",
                                    value = formatBytes(res.compressedSizeBytes),
                                    subtitle = "${res.compressedWidth}x${res.compressedHeight}"
                                )
                                Divider(
                                    modifier = Modifier
                                        .height(40.dp)
                                        .width(1.dp)
                                )
                                StatItem(
                                    label = "Saved",
                                    value = formatBytes(res.savedBytes),
                                    subtitle = "${res.savingsPercentage}% cut"
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))
                }

                // Preset Selection (High, Standard, Low, Custom)
                Text(
                    text = "Compression Level / کمپریشن کے آپشنز",
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    CompressionPreset.values().forEach { preset ->
                        val isSelected = selectedPreset == preset
                        FilterChip(
                            selected = isSelected,
                            onClick = {
                                selectedPreset = preset
                                recompress()
                            },
                            label = {
                                Text(
                                    text = when (preset) {
                                        CompressionPreset.HIGH -> "High / زیادہ"
                                        CompressionPreset.STANDARD -> "Standard / درمیانہ"
                                        CompressionPreset.LOW -> "Low / ہلکا"
                                        CompressionPreset.CUSTOM -> "Custom / کسٹم"
                                    },
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Custom Percentage Quality Slider
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Compression Quality (${customQuality}%)",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 13.sp
                            )
                            Text(
                                text = if (customQuality < 40) "Aggressive" else if (customQuality < 75) "Balanced" else "High Fidelity",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.primary,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        Slider(
                            value = customQuality.toFloat(),
                            onValueChange = {
                                customQuality = it.toInt()
                                if (selectedPreset != CompressionPreset.CUSTOM) {
                                    selectedPreset = CompressionPreset.CUSTOM
                                }
                            },
                            onValueChangeFinished = {
                                recompress()
                            },
                            valueRange = 10f..100f,
                            steps = 17
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("10% (Max Saving)", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("50% (Standard)", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text("100% (Lossless)", fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Output Format Selector (JPEG, PNG, WEBP)
                Text(
                    text = "Convert Format / فارمیٹ تبدیل کریں",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutputFormat.values().forEach { fmt ->
                        val isSelected = selectedFormat == fmt
                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = if (isSelected) MaterialTheme.colorScheme.secondaryContainer else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                            border = BorderStroke(
                                1.dp,
                                if (isSelected) MaterialTheme.colorScheme.primary else Color.Transparent
                            ),
                            modifier = Modifier
                                .weight(1f)
                                .clickable {
                                    selectedFormat = fmt
                                    recompress()
                                }
                        ) {
                            Column(
                                modifier = Modifier.padding(vertical = 10.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = fmt.displayName,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) MaterialTheme.colorScheme.onSecondaryContainer else MaterialTheme.colorScheme.onSurface
                                )
                            }
                        }
                    }
                }

                // Native Ad in the middle of workflow as user requested
                Spacer(modifier = Modifier.height(14.dp))
                NativeAdCard()

                Spacer(modifier = Modifier.height(14.dp))

                // Download & Share Actions
                // User prompt rule: "اور وہ ڈاؤن لوڈ کا اپشن ہے وہ ڈاؤن لوڈ پر کلک کر رہا ہے تو ریوائڈڈ اینڈ لگا ہو... جیسے ڈاؤن لوڈ پہ کلک کر کے واپس ریوارڈ ایڈ دیکھے گا تو ڈاؤن لوڈ ہو جائے گی"
                Button(
                    onClick = {
                        val result = compressionResult ?: return@Button
                        adManager.showRewardedAd {
                            coroutineScope.launch {
                                val savedUri = fileSaver.saveToGallery(result)
                                saveSuccessMessage = if (savedUri != null) {
                                    "✓ Saved to Gallery! (Pictures/ImageCompressor)"
                                } else {
                                    "Image download saved successfully."
                                }
                            }
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Icon(Icons.Default.Download, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Watch Ad & Download / ڈاؤن لوڈ کریں", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Saves directly to Gallery with 100% privacy", fontSize = 10.sp)
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedButton(
                    onClick = {
                        compressionResult?.let { res ->
                            fileSaver.shareImage(res)
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(46.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Share Compressed Image")
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    // Rewarded Ad Dialog Triggered on Download
    if (isRewardedActive) {
        RewardedAdDialog(
            onDismiss = {
                adManager.cancelRewardedAd()
            },
            onRewardEarned = {
                adManager.completeRewardedAd()
            }
        )
    }

    // Interstitial Ad Dialog Triggered on Repeated / Second Compression
    if (isInterstitialActive) {
        InterstitialAdDialog(
            onDismiss = {
                adManager.dismissInterstitialAd()
            }
        )
    }
}

@Composable
private fun StatItem(label: String, value: String, subtitle: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
        Text(text = subtitle, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

private fun formatBytes(bytes: Long): String {
    if (bytes <= 0) return "0 KB"
    val kb = bytes / 1024.0
    val mb = kb / 1024.0
    return if (mb >= 1.0) {
        String.format("%.2f MB", mb)
    } else {
        String.format("%.1f KB", kb)
    }
}

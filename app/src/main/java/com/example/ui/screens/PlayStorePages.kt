package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun PrivacyPolicyScreen() {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
    ) {
        PolicySectionHeader(
            icon = Icons.Default.Security,
            title = "Privacy Policy / پرائیویسی پالیسی",
            subtitle = "Last Updated: September 2026 • Compliant with Google Play Store Policies"
        )

        Spacer(modifier = Modifier.height(16.dp))

        PolicyCard(
            title = "1. Zero Photo Upload (100% On-Device)",
            content = "Your privacy is our highest priority. All image compression, resizing, and format conversions take place entirely locally on your device. We do NOT upload, store, or transmit your photos to any external cloud servers."
        )

        PolicyCard(
            title = "2. Zero Dangerous Permissions",
            content = "This app strictly adheres to Google Play's modern storage policies. It utilizes the Android system Photo Picker (PickVisualMedia) to let you select only the photos you choose, without requiring broad READ_EXTERNAL_STORAGE or media collection permissions."
        )

        PolicyCard(
            title = "3. Advertising & AdMob Disclosures",
            content = "This application is supported by advertising delivered via Google AdMob (including Banner, Native, Interstitial, and Rewarded ads). AdMob may collect pseudonymous identifiers (e.g. Google Advertising ID) and device telemetry in compliance with Google Play Developer Program policies and the EU User Consent Policy."
        )

        PolicyCard(
            title = "4. Data Security & Storage",
            content = "Compressed photos saved by this app are stored directly to your device's public 'Pictures/ImageCompressor' folder via the standard MediaStore API. You retain full ownership and control over your files at all times."
        )

        PolicyCard(
            title = "5. Contact & Inquiries",
            content = "If you have questions regarding this privacy policy or application behavior, contact developer support at support@imagecompressor.app."
        )
    }
}

@Composable
fun TermsOfServiceScreen() {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
    ) {
        PolicySectionHeader(
            icon = Icons.Default.Description,
            title = "Terms of Service / شرائط و ضوابط",
            subtitle = "Terms governing the use of Image Compressor"
        )

        Spacer(modifier = Modifier.height(16.dp))

        PolicyCard(
            title = "1. Acceptance of Terms",
            content = "By downloading, installing, or using Image Compressor, you agree to comply with and be bound by these Terms of Service. If you disagree, please do not use the application."
        )

        PolicyCard(
            title = "2. License & Permitted Use",
            content = "You are granted a personal, revocable, non-exclusive, non-transferable license to use Image Compressor for personal and lawful commercial image processing purposes."
        )

        PolicyCard(
            title = "3. Rewarded Video Ads",
            content = "Certain features, such as premium export/downloading, may offer rewarded video ads provided by third-party ad networks. Rewards are credited upon voluntary completion of the advertisement."
        )

        PolicyCard(
            title = "4. Disclaimer of Warranty",
            content = "Image Compressor is provided 'as is' without warranty of any kind. While every effort is made to maintain optimal image fidelity, compression inherently reduces file size by adjusting compression coefficients."
        )
    }
}

@Composable
fun CompressionGuideScreen() {
    val scrollState = rememberScrollState()
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(16.dp)
    ) {
        PolicySectionHeader(
            icon = Icons.Default.HelpOutline,
            title = "Compression Guide & Best Settings",
            subtitle = "How to achieve the best quality-to-size ratio"
        )

        Spacer(modifier = Modifier.height(16.dp))

        PolicyCard(
            title = "⚡ High Compression (ہائی کمپریشن)",
            content = "Reduces size by 80% to 90%. Ideal for email attachments (under 25MB), web uploads, government job portal applications, or sending dozens of photos quickly over slow networks."
        )

        PolicyCard(
            title = "⚖️ Standard Compression (سٹینڈرڈ کمپریشن)",
            content = "Reduces size by 50% to 70%. Best all-round balance. Preserves crisp sharp details and vibrant colors while cutting file sizes significantly for WhatsApp, Telegram, and social media."
        )

        PolicyCard(
            title = "💎 Low Compression (لو کمپریشن)",
            content = "Reduces size by 20% to 40%. Near-lossless visual quality. Recommended for professional photography, wallpaper prints, and archiving."
        )

        PolicyCard(
            title = "📁 Choosing the Right Format",
            content = "• WEBP: Modern web format with the highest compression efficiency (up to 30% smaller than JPEG at equal quality).\n• JPEG (.jpg): Universally compatible with all devices and websites.\n• PNG: Best for graphics, logos, and screenshots."
        )
    }
}

@Composable
private fun PolicySectionHeader(
    icon: ImageVector,
    title: String,
    subtitle: String
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.fillMaxWidth()
    ) {
        Surface(
            color = MaterialTheme.colorScheme.primaryContainer,
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.size(48.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column {
            Text(
                text = title,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun PolicyCard(
    title: String,
    content: String
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = content,
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                lineHeight = 18.sp
            )
        }
    }
}

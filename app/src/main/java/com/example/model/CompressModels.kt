package com.example.model

import android.graphics.Bitmap
import android.net.Uri

enum class CompressionPreset(val title: String, val titleUrdu: String, val reductionTarget: String, val defaultQuality: Int) {
    HIGH("High Compression", "ہائی کمپریشن", "80-90% Reduction", 35),
    STANDARD("Standard Compression", "سٹینڈرڈ کمپریشن", "50-70% Reduction", 65),
    LOW("Low Compression", "لو کمپریشن", "20-40% Reduction", 85),
    CUSTOM("Custom Percentage", "کسٹم فیصد", "Custom Ratio", 70)
}

enum class OutputFormat(val extension: String, val mimeType: String, val displayName: String, val compressFormat: Bitmap.CompressFormat) {
    JPEG("jpg", "image/jpeg", "JPEG (.jpg)", Bitmap.CompressFormat.JPEG),
    PNG("png", "image/png", "PNG (.png)", Bitmap.CompressFormat.PNG),
    WEBP("webp", "image/webp", "WEBP (.webp)", Bitmap.CompressFormat.WEBP)
}

data class ImageMetadata(
    val uri: Uri,
    val fileName: String,
    val originalSizeBytes: Long,
    val width: Int,
    val height: Int
)

data class CompressionResult(
    val originalUri: Uri,
    val originalSizeBytes: Long,
    val compressedSizeBytes: Long,
    val originalWidth: Int,
    val originalHeight: Int,
    val compressedWidth: Int,
    val compressedHeight: Int,
    val format: OutputFormat,
    val quality: Int,
    val savedBytes: Long = (originalSizeBytes - compressedSizeBytes).coerceAtLeast(0),
    val savingsPercentage: Int = if (originalSizeBytes > 0) {
        (((originalSizeBytes - compressedSizeBytes).toFloat() / originalSizeBytes) * 100).toInt().coerceAtLeast(0)
    } else 0,
    val compressedBitmap: Bitmap? = null,
    val tempFilePath: String? = null
)

package com.example.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.provider.OpenableColumns
import com.example.model.CompressionPreset
import com.example.model.CompressionResult
import com.example.model.ImageMetadata
import com.example.model.OutputFormat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import kotlin.math.roundToInt

class ImageCompressor(private val context: Context) {

    suspend fun getImageMetadata(uri: Uri): ImageMetadata? = withContext(Dispatchers.IO) {
        try {
            var fileName = "image.jpg"
            var fileSize = 0L

            context.contentResolver.query(uri, null, null, null, null)?.use { cursor ->
                val nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                val sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE)
                if (cursor.moveToFirst()) {
                    if (nameIndex != -1) fileName = cursor.getString(nameIndex) ?: fileName
                    if (sizeIndex != -1) fileSize = cursor.getLong(sizeIndex)
                }
            }

            if (fileSize == 0L) {
                context.contentResolver.openInputStream(uri)?.use { stream ->
                    fileSize = stream.available().toLong()
                }
            }

            val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            context.contentResolver.openInputStream(uri)?.use { stream ->
                BitmapFactory.decodeStream(stream, null, options)
            }

            ImageMetadata(
                uri = uri,
                fileName = fileName,
                originalSizeBytes = fileSize,
                width = options.outWidth,
                height = options.outHeight
            )
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun compressImage(
        uri: Uri,
        preset: CompressionPreset,
        customQuality: Int,
        format: OutputFormat,
        scalePercent: Int = 100
    ): CompressionResult? = withContext(Dispatchers.IO) {
        try {
            val metadata = getImageMetadata(uri) ?: return@withContext null
            val inputStream: InputStream = context.contentResolver.openInputStream(uri) ?: return@withContext null
            var sourceBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream.close()

            if (sourceBitmap == null) return@withContext null

            // Determine target quality based on preset or custom slider
            val quality = when (preset) {
                CompressionPreset.HIGH -> 35
                CompressionPreset.STANDARD -> 65
                CompressionPreset.LOW -> 85
                CompressionPreset.CUSTOM -> customQuality.coerceIn(5, 100)
            }

            // Downscale resolution for High compression or custom scale
            var targetScale = (scalePercent / 100f).coerceIn(0.1f, 1.0f)
            if (preset == CompressionPreset.HIGH && targetScale > 0.75f) {
                targetScale = 0.75f
            }

            var processedBitmap = sourceBitmap
            if (targetScale < 0.99f) {
                val newWidth = (sourceBitmap.width * targetScale).roundToInt().coerceAtLeast(1)
                val newHeight = (sourceBitmap.height * targetScale).roundToInt().coerceAtLeast(1)
                processedBitmap = Bitmap.createScaledBitmap(sourceBitmap, newWidth, newHeight, true)
            }

            // Output stream compression
            val byteStream = ByteArrayOutputStream()
            val actualQuality = if (format == OutputFormat.PNG) 100 else quality
            processedBitmap.compress(format.compressFormat, actualQuality, byteStream)
            val compressedBytes = byteStream.toByteArray()
            byteStream.close()

            // Save to temporary cache file for preview and saving
            val tempFile = File(context.cacheDir, "compressed_${System.currentTimeMillis()}.${format.extension}")
            FileOutputStream(tempFile).use { fos ->
                fos.write(compressedBytes)
                fos.flush()
            }

            CompressionResult(
                originalUri = uri,
                originalSizeBytes = metadata.originalSizeBytes,
                compressedSizeBytes = tempFile.length(),
                originalWidth = metadata.width,
                originalHeight = metadata.height,
                compressedWidth = processedBitmap.width,
                compressedHeight = processedBitmap.height,
                format = format,
                quality = quality,
                compressedBitmap = processedBitmap,
                tempFilePath = tempFile.absolutePath
            )
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}

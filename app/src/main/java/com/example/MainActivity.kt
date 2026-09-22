package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Compress
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.example.ads.AdManager
import com.example.ui.screens.CompressionGuideScreen
import com.example.ui.screens.CompressorScreen
import com.example.ui.screens.PrivacyPolicyScreen
import com.example.ui.screens.TermsOfServiceScreen
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
    private val adManager = AdManager()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            MyApplicationTheme {
                MainAppContainer(adManager = adManager)
            }
        }
    }
}

@Composable
fun MainAppContainer(adManager: AdManager) {
    var currentTab by remember { mutableStateOf("compressor") }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = currentTab == "compressor",
                    onClick = { currentTab = "compressor" },
                    icon = { Icon(Icons.Default.Compress, contentDescription = "Compress") },
                    label = { Text("Compress") }
                )
                NavigationBarItem(
                    selected = currentTab == "guide",
                    onClick = { currentTab = "guide" },
                    icon = { Icon(Icons.Default.HelpOutline, contentDescription = "Guide") },
                    label = { Text("Guide") }
                )
                NavigationBarItem(
                    selected = currentTab == "privacy",
                    onClick = { currentTab = "privacy" },
                    icon = { Icon(Icons.Default.Security, contentDescription = "Privacy") },
                    label = { Text("Privacy") }
                )
                NavigationBarItem(
                    selected = currentTab == "terms",
                    onClick = { currentTab = "terms" },
                    icon = { Icon(Icons.Default.Description, contentDescription = "Terms") },
                    label = { Text("Terms") }
                )
            }
        }
    ) { innerPadding ->
        Surface(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding),
            color = MaterialTheme.colorScheme.background
        ) {
            when (currentTab) {
                "compressor" -> CompressorScreen(
                    adManager = adManager,
                    onNavigateToPolicy = { route -> currentTab = route }
                )
                "privacy" -> PrivacyPolicyScreen()
                "terms" -> TermsOfServiceScreen()
                "guide" -> CompressionGuideScreen()
            }
        }
    }
}

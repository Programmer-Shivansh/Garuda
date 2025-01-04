package altermarkive.guardian

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.util.Locale

class FallDetectedActivity : Activity() {
    private lateinit var speechRecognizer: SpeechRecognizer
    private lateinit var statusText: TextView
    private val handler = Handler(Looper.getMainLooper())
    private var isListening = false
    private val PERMISSION_REQUEST_CODE = 123

    private val requiredPermissions = arrayOf(
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.CALL_PHONE
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_fall_detected)
        window.statusBarColor = getColor(R.color.black)
        window.navigationBarColor = getColor(R.color.black)

        initializeViews()
        checkPermissions()
    }

    private fun initializeViews() {
        val helpButton: Button = findViewById(R.id.help_button)
        val errorButton: Button = findViewById(R.id.error_button)
        statusText = findViewById(R.id.status_text)

        helpButton.setOnClickListener {
            callEmergencyContact()
            finish()
        }

        errorButton.setOnClickListener {
            finish()
        }
    }

    private fun checkPermissions() {
        val missingPermissions = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isEmpty()) {
            startFallDetectionProcess()
        } else {
            ActivityCompat.requestPermissions(
                this,
                missingPermissions.toTypedArray(),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    private fun startFallDetectionProcess() {
        if (SpeechRecognizer.isRecognitionAvailable(this)) {
            startVoiceRecognition()
            startEmergencyTimer()
        } else {
            Toast.makeText(this, "Voice recognition not available", Toast.LENGTH_SHORT).show()
            startEmergencyTimer()
        }
    }

    private fun startVoiceRecognition() {
        if (!isListening) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this)
            speechRecognizer.setRecognitionListener(createRecognitionListener())

            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
                putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            }

            try {
                speechRecognizer.startListening(intent)
                isListening = true
                updateStatus("Listening for voice response...")
            } catch (e: Exception) {
                handleError("Error starting voice recognition: ${e.message}")
            }
        }
    }

    private fun createRecognitionListener() = object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {
            updateStatus("Listening...")
        }

        override fun onBeginningOfSpeech() {
            updateStatus("Speech detected...")
        }

        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}

        override fun onEndOfSpeech() {
            isListening = false
            restartVoiceRecognition()
        }

        override fun onError(error: Int) {
            isListening = false
            val errorMessage = when (error) {
                SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                SpeechRecognizer.ERROR_CLIENT -> "Client side error"
                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Insufficient permissions"
                SpeechRecognizer.ERROR_NETWORK -> "Network error"
                SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                SpeechRecognizer.ERROR_NO_MATCH -> "No speech input"
                SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Recognition service busy"
                SpeechRecognizer.ERROR_SERVER -> "Server error"
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input"
                else -> "Unknown error"
            }
            handleError(errorMessage)
            restartVoiceRecognition()
        }

        override fun onResults(results: Bundle?) {
            val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
            if (!matches.isNullOrEmpty()) {
                val spokenText = matches[0].lowercase()
                when {
                    spokenText.contains("fine") || 
                    spokenText.contains("okay") || 
                    spokenText.contains("ok") || 
                    spokenText.contains("alright") || 
                    spokenText.contains("i am fine") || 
                    spokenText.contains("i'm fine") || 
                    spokenText.contains("i am okay") -> {
                        updateStatus("Voice response received: '$spokenText'. Canceling emergency...")
                        handler.removeCallbacksAndMessages(null) // Remove emergency timer
                        handler.postDelayed({ finish() }, 1500)
                    }
                    spokenText.contains("help") || 
                    spokenText.contains("emergency") || 
                    spokenText.contains("need help") -> {
                        updateStatus("Voice command received: '$spokenText'. Calling emergency contact...")
                        callEmergencyContact()
                    }
                    else -> {
                        updateStatus("Didn't catch that. Please try again or use the buttons.")
                        restartVoiceRecognition()
                    }
                }
            }
        }

        override fun onPartialResults(partialResults: Bundle?) {}
        override fun onEvent(eventType: Int, params: Bundle?) {}
    }

    private fun restartVoiceRecognition() {
        if (!isFinishing) {
            handler.postDelayed({ startVoiceRecognition() }, 1000)
        }
    }

    private fun startEmergencyTimer() {
        handler.postDelayed({
            if (!isFinishing) {
                updateStatus("No response received. Initiating emergency contact...")
                callEmergencyContact()
                handler.postDelayed({ finish() }, 1500)
            }
        }, 7000) // Changed to 7 seconds
    }

    private fun callEmergencyContact() {
        try {
            val contact = UserDetails[this]
            if (contact != null) {
                SendDm.sms(this, contact, "Fall detected! Location: ${LocationHelper(this).getLocationString()}")
                // Add call functionality here if needed
            } else {
                handleError("No emergency contact configured")
            }
        } catch (e: Exception) {
            handleError("Error contacting emergency number: ${e.message}")
        }
    }

    private fun updateStatus(message: String) {
        runOnUiThread {
            statusText.text = message
            statusText.setTextColor(getColor(R.color.white))
        }
    }

    private fun handleError(error: String) {
        updateStatus("Error: $error")
        Toast.makeText(this, error, Toast.LENGTH_SHORT).show()
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                startFallDetectionProcess()
            } else {
                handleError("Required permissions not granted")
                handler.postDelayed({ finish() }, 2000)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::speechRecognizer.isInitialized) {
            speechRecognizer.destroy()
        }
        handler.removeCallbacksAndMessages(null)
    }
}

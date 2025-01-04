package altermarkive.guardian

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.media.MediaPlayer
import android.os.Bundle
import android.os.CountDownTimer
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.util.Locale
import android.view.WindowManager

class FallDetectedActivity : AppCompatActivity() {
    companion object {
        const val REQUEST_CODE = 1001
    }

    private var warningSound: MediaPlayer? = null
    private var countdownTimer: CountDownTimer? = null
    private var isFinishing = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_fall_detected)

        // Make sure activity shows on top of lock screen
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )

        initializeUI()
        startWarningSound()
        startCountdown()
    }

    private fun initializeUI() {
        findViewById<TextView>(R.id.status_text).text = 
            "Fall Detected!\nPress 'I'm Fine' within 7 seconds\nor emergency alert will be sent"

        // Hide help button as we're only using the fine button
        findViewById<Button>(R.id.help_button).visibility = View.GONE
        
        val fineButton = findViewById<Button>(R.id.error_button)
        fineButton.text = "I'm Fine"
        fineButton.setOnClickListener {
            userIsFine()
        }
    }

    private fun startWarningSound() {
        try {
            warningSound = MediaPlayer.create(this, R.raw.alarm).apply {
                isLooping = true
                start()
            }
        } catch (e: Exception) {
            Log.e("FallDetected", "Error playing sound: ${e.message}")
        }
    }

    private fun startCountdown() {
        countdownTimer = object : CountDownTimer(7000, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                try {
                    if (!isFinishing) {
                        findViewById<Button>(R.id.error_button)?.text = 
                            "I'm Fine (${millisUntilFinished/1000}s)"
                    }
                } catch (e: Exception) {
                    Log.e("FallDetected", "Error updating countdown: ${e.message}")
                }
            }

            override fun onFinish() {
                if (!isFinishing) {
                    userNeedsHelp()
                }
            }
        }.start()
    }

    private fun userIsFine() {
        isFinishing = true
        cleanup()
        setResult(Activity.RESULT_CANCELED)
        Toast.makeText(this, "Stay safe!", Toast.LENGTH_SHORT).show()
        finish()
    }

    private fun userNeedsHelp() {
        isFinishing = true
        cleanup()
        setResult(Activity.RESULT_OK)
        finish()
    }

    private fun cleanup() {
        try {
            countdownTimer?.cancel()
            countdownTimer = null

            warningSound?.apply {
                if (isPlaying) stop()
                release()
            }
            warningSound = null
        } catch (e: Exception) {
            Log.e("FallDetected", "Error in cleanup: ${e.message}")
        }
    }

    override fun onDestroy() {
        cleanup()
        super.onDestroy()
    }

    override fun onBackPressed() {
        // Prevent back button from closing without making a choice
    }
}

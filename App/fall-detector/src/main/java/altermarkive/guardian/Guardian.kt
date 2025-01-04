package altermarkive.guardian

import android.Manifest
import android.annotation.SuppressLint
import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.IBinder
import android.widget.Toast
import androidx.annotation.RequiresApi
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import android.util.Log

class Guardian : Service() {
    override fun onCreate() {
        super.onCreate()
        locating.initiate(this)
        Tracker.instance(this)
        Sampler.instance(this)
        Ring.instance(this)
        checkAndRequestPermissions()
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun createNotificationChannel(): String {
        val channelId = resources.getString(R.string.app)
        val channelName = "$channelId Background Service"
        val channel = NotificationChannel(
            channelId,
            channelName,
            NotificationManager.IMPORTANCE_NONE
        )
        channel.lockscreenVisibility = Notification.VISIBILITY_PRIVATE
        val service = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        service.createNotificationChannel(channel)
        return channelId
    }

    @SuppressLint("UnspecifiedImmutableFlag")
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val now = System.currentTimeMillis()
        val app = resources.getString(R.string.app)
        val channelId = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createNotificationChannel()
        } else {
            ""
        }

        val main = Intent(this, Main::class.java)
        val pendingIntentFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        val pending = PendingIntent.getActivity(this, 0, main, pendingIntentFlag)

        val notification = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.stat_sys_warning)
            .setContentTitle(app)
            .setContentText("$app is active")
            .setWhen(now)
            .setContentIntent(pending)
            .build()

        startForeground(1, notification)
        return START_STICKY
    }

    private fun checkAndRequestPermissions() {
        val permissions = arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.SEND_SMS,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_PHONE_STATE
        )

        for (permission in permissions) {
            if (ActivityCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                Log.w(TAG, "Permission not granted: $permission")
            }
        }
    }

    override fun onBind(intent: Intent): IBinder? {
        return null
    }

    companion object {
        private val TAG: String = Guardian::class.java.simpleName

        internal fun initiate(context: Context) {
            val intent = Intent(context, Guardian::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        internal fun say(context: Context, level: Int, tag: String, message: String) {
            Log.println(level, tag, message)
            Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
        }
    }
}
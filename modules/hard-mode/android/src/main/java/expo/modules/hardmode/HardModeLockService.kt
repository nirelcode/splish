package expo.modules.hardmode

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat

class HardModeLockService : Service() {

  companion object {
    private const val CHANNEL_ID = "splish_hard_mode"
    private const val NOTIF_ID   = 9001
  }

  private var windowManager: WindowManager? = null
  private var overlayRoot: FrameLayout? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      "START" -> showOverlay()
      "STOP"  -> { removeOverlay(); stopSelf() }
    }
    return START_STICKY
  }

  // ── Overlay ───────────────────────────────────────────────────────────────

  private fun showOverlay() {
    if (overlayRoot != null) return
    if (!Settings.canDrawOverlays(this)) return

    startForegroundService()

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      else
        @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
        WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
      PixelFormat.OPAQUE
    )

    val root = FrameLayout(this).apply {
      setBackgroundColor(Color.parseColor("#E6F4FE"))
    }

    val inner = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(64, 0, 64, 0)
    }

    // 💧 emoji
    inner.addView(TextView(this).apply {
      text = "💧"
      textSize = 80f
      gravity = Gravity.CENTER
    })

    // Title
    inner.addView(TextView(this).apply {
      text = "Time to drink water!"
      textSize = 26f
      typeface = Typeface.DEFAULT_BOLD
      setTextColor(Color.parseColor("#152D5C"))
      gravity = Gravity.CENTER
      setPadding(0, 24, 0, 12)
    })

    // Subtitle
    inner.addView(TextView(this).apply {
      text = "Open Splish to verify and unlock your phone"
      textSize = 15f
      setTextColor(Color.parseColor("#4A6F9C"))
      gravity = Gravity.CENTER
      setPadding(0, 0, 0, 48)
    })

    // Open Splish button
    inner.addView(buildOpenButton())

    root.addView(inner, FrameLayout.LayoutParams(
      FrameLayout.LayoutParams.MATCH_PARENT,
      FrameLayout.LayoutParams.WRAP_CONTENT,
      Gravity.CENTER
    ))

    windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    overlayRoot   = root
    windowManager?.addView(root, params)
  }

  private fun buildOpenButton(): TextView {
    val bg = GradientDrawable().apply {
      setColor(Color.parseColor("#152D5C"))
      cornerRadius = 120f
    }
    return TextView(this).apply {
      text = "Open Splish"
      textSize = 18f
      typeface = Typeface.DEFAULT_BOLD
      setTextColor(Color.WHITE)
      gravity = Gravity.CENTER
      background = bg
      setPadding(80, 40, 80, 40)
      setOnClickListener {
        packageManager.getLaunchIntentForPackage(packageName)?.apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }?.let { startActivity(it) }
      }
    }
  }

  private fun removeOverlay() {
    overlayRoot?.let {
      runCatching { windowManager?.removeView(it) }
      overlayRoot = null
    }
    windowManager = null
  }

  // ── Foreground notification ───────────────────────────────────────────────

  private fun startForegroundService() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Hard Mode",
        NotificationManager.IMPORTANCE_LOW
      ).apply { description = "Hard Mode lock screen service" }
      (getSystemService(NOTIFICATION_SERVICE) as NotificationManager)
        .createNotificationChannel(channel)
    }

    val openIntent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }
    val pendingIntent = PendingIntent.getActivity(
      this, 0, openIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val notif = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle("Hard Mode Active 💧")
      .setContentText("Tap to open Splish and verify you've had water")
      .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()

    startForeground(NOTIF_ID, notif)
  }

  override fun onDestroy() {
    removeOverlay()
    super.onDestroy()
  }
}

package expo.modules.hardmode

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HardModeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HardMode")

    // ── Overlay permission ────────────────────────────────────────────────────
    AsyncFunction("canDrawOverlays") { ->
      Settings.canDrawOverlays(appContext.reactContext)
    }

    // ── Usage access permission ───────────────────────────────────────────────
    AsyncFunction("canAccessUsageStats") { ->
      val ctx = appContext.reactContext ?: return@AsyncFunction false
      val appOps = ctx.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager
        ?: return@AsyncFunction false
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        appOps.unsafeCheckOpNoThrow(
          AppOpsManager.OPSTR_GET_USAGE_STATS,
          Process.myUid(),
          ctx.packageName
        )
      } else {
        @Suppress("DEPRECATION")
        appOps.checkOpNoThrow(
          AppOpsManager.OPSTR_GET_USAGE_STATS,
          Process.myUid(),
          ctx.packageName
        )
      }
      mode == AppOpsManager.MODE_ALLOWED
    }

    // ── Lock / unlock ─────────────────────────────────────────────────────────
    Function("startLock") {
      val ctx = appContext.reactContext ?: return@Function null
      val intent = Intent(ctx, HardModeLockService::class.java).apply { action = "START" }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        ctx.startForegroundService(intent)
      } else {
        ctx.startService(intent)
      }
    }

    Function("stopLock") {
      val ctx = appContext.reactContext ?: return@Function null
      ctx.startService(Intent(ctx, HardModeLockService::class.java).apply { action = "STOP" })
    }
  }
}

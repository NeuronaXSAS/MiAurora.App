/**
 * Wake Lock API for keeping screen active during GPS tracking
 */

let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  if (!("wakeLock" in navigator)) {
    console.warn("Wake Lock API not supported");
    return false;
  }

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    
    wakeLock.addEventListener("release", () => {
      console.log("Wake Lock released");
    });

    console.log("Wake Lock acquired");
    return true;
  } catch (err) {
    console.error("Wake Lock request failed:", err);
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log("Wake Lock manually released");
    } catch (err) {
      console.error("Wake Lock release failed:", err);
    }
  }
}

export function isWakeLockActive(): boolean {
  return wakeLock !== null && !wakeLock.released;
}

// Re-acquire wake lock when page becomes visible again
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", async () => {
    if (wakeLock !== null && document.visibilityState === "visible") {
      console.log("Page visible - re-acquiring wake lock");
      await requestWakeLock();
    }
  });

  // Handle focus events for tab switching
  window.addEventListener("focus", async () => {
    if (wakeLock !== null) {
      console.log("Window focused - ensuring wake lock");
      await requestWakeLock();
    }
  });
}

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const VAPID_PUBLIC_KEY_STORAGE = "glowhub_vapid_public_key";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check if already subscribed
  useEffect(() => {
    if (!user || !isSupported) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch {
        setIsSubscribed(false);
      }
    })();
  }, [user, isSupported]);

  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return false;
    setLoading(true);

    try {
      // Request notification permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        toast.error("Notification permission denied. Enable it in your browser settings.");
        setLoading(false);
        return false;
      }

      // Fetch VAPID public key from edge function
      const { data: vapidData, error: vapidErr } = await supabase.functions.invoke("glow-watchdog", {
        method: "GET",
      });

      // Use a fallback approach — get VAPID key from env
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        toast.error("Push notifications are not configured yet. Please contact support.");
        setLoading(false);
        return false;
      }

      const reg = await navigator.serviceWorker.ready;

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      const subJson = subscription.toJSON();

      // Save to database
      const { error } = await supabase.from("push_subscriptions").upsert(
        {
          user_id: user.id,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
          enabled: true,
        },
        { onConflict: "user_id,endpoint" }
      );

      if (error) {
        console.error("Failed to save push subscription:", error);
        toast.error("Failed to save notification preferences.");
        setLoading(false);
        return false;
      }

      setIsSubscribed(true);
      toast.success("🔔 Offline alerts enabled! You'll be notified when screens go down.");
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error("Push subscription error:", err);
      toast.error("Failed to enable notifications: " + (err.message || "Unknown error"));
      setLoading(false);
      return false;
    }
  }, [user, isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!user || !isSupported) return;
    setLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();

        // Remove from database
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", user.id)
          .eq("endpoint", endpoint);
      }

      setIsSubscribed(false);
      toast.success("Offline alerts disabled.");
    } catch (err: any) {
      console.error("Push unsubscribe error:", err);
      toast.error("Failed to disable notifications.");
    } finally {
      setLoading(false);
    }
  }, [user, isSupported]);

  return {
    isSupported,
    isSubscribed,
    loading,
    permission,
    subscribe,
    unsubscribe,
  };
}

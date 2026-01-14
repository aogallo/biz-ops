import { useEffect, useRef } from "react";
import { toast } from "sonner";

export type ToastData = {
  type: "success" | "error" | "info";
  message: string;
} | null;

export function useToastFromLoader(toastData: ToastData) {
  // Track last shown toast by message content only
  const lastShownRef = useRef<string | null>(null);

  useEffect(() => {
    if (!toastData) return;

    // Create unique key from message only
    // This prevents duplicates during re-renders but allows fresh flash messages
    const messageKey = toastData.message;

    // Only show if different from last message
    if (lastShownRef.current === messageKey) return;

    lastShownRef.current = messageKey;

    // Show toast based on type
    switch (toastData.type) {
      case "error":
        toast.error(toastData.message);
        break;
      case "success":
        toast.success(toastData.message);
        break;
      case "info":
        toast.info(toastData.message);
        break;
    }
  }, [toastData]);
}

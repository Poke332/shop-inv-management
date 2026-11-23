import { useEffect, useRef } from "react";
import { Keyboard, Platform } from "react-native";

// Keeps the focused input visible while the on-screen keyboard is up.
// Native: after KeyboardAvoidingView finishes resizing the layout, hoist
// the focused input above the keyboard line. Web: the KAV is a no-op
// there, so the equivalent is scrolling the focused input into view on
// focus. The native ScrollView exposes scrollToFocusedInput; the web
// ScrollView does not, so the web path uses the document's active
// element instead of calling a method that is undefined on web.
export function useFormKeyboard() {
  const scrollRef = useRef(null);
  const timer = useRef(null);

  function revealFocusedInput() {
    clearTimeout(timer.current);
    // Native: wait for the keyboard-avoiding layout to settle before
    // scrolling.
    timer.current = setTimeout(() => {
      if (Platform.OS === "web") {
        // The web ScrollView has no scrollToFocusedInput; keep the
        // active input in view with the browser's own scroll API.
        if (typeof document !== "undefined") {
          document.activeElement?.scrollIntoView?.({ block: "nearest" });
        }
        return;
      }
      scrollRef.current?.scrollToFocusedInput?.();
    }, Platform.OS === "web" ? 0 : 250);
  }

  useEffect(() => {
    if (Platform.OS === "web") return undefined;
    const subscription = Keyboard.addListener(
      "keyboardDidShow",
      revealFocusedInput
    );
    return () => {
      subscription?.remove();
      clearTimeout(timer.current);
    };
  }, []);

  return { scrollRef, revealFocusedInput };
}

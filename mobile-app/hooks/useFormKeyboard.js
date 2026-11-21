import { useEffect, useRef } from "react";
import { Keyboard, Platform } from "react-native";

// Keeps the focused input visible while the on-screen keyboard is up.
// Native: after KeyboardAvoidingView finishes resizing the layout, hoist
// the focused input above the keyboard line. Web: the KAV is a no-op
// there, so the equivalent is scrolling the focused input into view on
// focus.
export function useFormKeyboard() {
  const scrollRef = useRef(null);
  const timer = useRef(null);

  function revealFocusedInput() {
    clearTimeout(timer.current);
    // Native: wait for the keyboard-avoiding layout to settle before
    // scrolling.
    timer.current = setTimeout(
      () => scrollRef.current?.scrollToFocusedInput(),
      Platform.OS === "web" ? 0 : 250
    );
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

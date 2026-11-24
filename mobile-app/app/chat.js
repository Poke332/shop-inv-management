import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { TOP_BAR_HEIGHT } from "../components/TopBar";
import { BOTTOM_NAV_HEIGHT } from "../components/BottomNav";

// Same starter prompts the web chat panel offers.
const SUGGESTIONS = [
  "What is in stock under Rp 500.000?",
  "Recommend a gift for a gamer",
  "How do I place an order?",
];

// The assistant may answer with **bold** and [label](/path) markers (the web
// panel renders both as live elements). Mobile has neither, so strip the
// markers and show clean text instead of raw markdown.
function formatReply(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n");
}

// Same wording mapping the web panel uses for the three failure shapes.
function friendlyError(serverMessage, status) {
  if (status === 0)
    return "I cannot reach the server right now. Check your connection and try again.";
  if (status === 429)
    return "You are sending messages too quickly. Please wait a moment and try again.";
  if (status === 503)
    return serverMessage || "The assistant is unavailable right now.";
  return "Something went wrong. Please try again.";
}

let nextId = 0;
const newMessage = (fields) => ({ id: `chat-${++nextId}`, ...fields });

// Full-page chat assistant: stock questions, product recommendations and
// app help. Every answer comes from POST /api/chat (an LLM with tools that
// read the live database) — open to guests; a signed-in token only tailors
// the app-help answers to the account's role. This screen holds the
// conversation and renders it; the TopBar chat icon opens it.
export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Keep the newest message in view as the conversation grows.
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  // `base` is the conversation to continue from (a retry resends from before
  // the failed turn, so the error message itself is never replayed).
  async function send(raw, base = messages) {
    const text = raw.trim();
    if (!text || loading) return;
    const history = [
      ...base.filter((m) => !m.error),
      newMessage({ role: "user", content: text }),
    ];
    setMessages(history);
    setInput("");
    setLoading(true);

    let status = 0;
    let serverMessage = "";
    let reply = null;
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      status = response.status;
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        reply = data.reply ?? "";
      } else {
        serverMessage = data.message || "";
      }
    } catch {
      // Network failure — the friendly mapping turns status 0 into the
      // "cannot reach the server" line.
      status = 0;
    }

    if (reply !== null) {
      setMessages([
        ...history,
        newMessage({ role: "assistant", content: formatReply(reply) }),
      ]);
    } else {
      setMessages([
        ...history,
        newMessage({ role: "assistant", content: "", error: friendlyError(serverMessage, status) }),
      ]);
    }
    setLoading(false);
  }

  // Resend the last user message with everything before it as the history.
  function retry() {
    const index = messages.findLastIndex((m) => m.role === "user");
    if (index >= 0) send(messages[index].content, messages.slice(0, index));
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.bottom : 0}
    >
      {/* Assistant header — the pinned TopBar carries the store title, so
          this row identifies the assistant (mirrors the web panel header). */}
      <View
        style={[
          styles.assistantHeader,
          { paddingTop: TOP_BAR_HEIGHT + insets.top },
        ]}
      >
        <Feather name="message-circle" size={18} color="#C64A22" />
        <View style={styles.assistantTitleBlock}>
          <Text style={styles.assistantName}>Sunset assistant</Text>
          <Text style={styles.assistantTagline}>
            Stock, recommendations &amp; app help
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.log}
        contentContainerStyle={styles.logContent}
        showsVerticalScrollIndicator={false}
        accessibilityRole="log"
      >
        {messages.length === 0 && (
          <View>
            <Text style={styles.emptyText}>
              Hi! Ask me whether something is in stock, what to buy for your
              budget, or how to use the app.
            </Text>
            <View style={styles.suggestionRow}>
              {SUGGESTIONS.map((text) => (
                <TouchableOpacity
                  key={text}
                  style={styles.suggestionChip}
                  accessibilityRole="button"
                  accessibilityLabel={text}
                  onPress={() => send(text)}
                  disabled={loading}
                >
                  <Text style={styles.suggestionChipText}>{text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {messages.map((message) =>
          message.error ? (
            <View key={message.id} style={styles.errorBubble} accessibilityRole="alert">
              <Text style={styles.errorText}>{message.error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={retry}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              key={message.id}
              style={[
                styles.bubble,
                message.role === "user" ? styles.bubbleUser : styles.bubbleBot,
              ]}
            >
              <Text
                style={
                  message.role === "user" ? styles.bubbleTextUser : styles.bubbleTextBot
                }
              >
                {message.content}
              </Text>
            </View>
          )
        )}

        {loading && (
          <View
            style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}
            accessibilityLabel="The assistant is typing"
          >
            <ActivityIndicator size="small" color="#C64A22" />
            <Text style={styles.typingText}>The assistant is replying…</Text>
          </View>
        )}
      </ScrollView>

      {/* Input row — pinned above the bottom nav (which overlays the
          screen), mirroring the web panel's message form. */}
      <View style={[styles.inputRow, { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom }]}>
        <TextInput
          style={styles.input}
          accessibilityLabel="Message"
          placeholder="Type your question…"
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
          maxLength={1000}
          multiline
          autoCorrect={false}
          onSubmitEditing={() => send(input)}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (loading || !input.trim()) && styles.sendButtonDisabled]}
          onPress={() => send(input)}
          disabled={loading || !input.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Feather name="send" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  assistantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  assistantTitleBlock: {
    gap: 1,
  },
  assistantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  assistantTagline: {
    fontSize: 11,
    color: "#6B7280",
  },
  log: {
    flex: 1,
  },
  logContent: {
    padding: 16,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#374151",
    marginBottom: 12,
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  suggestionChipText: {
    fontSize: 12,
    color: "#374151",
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleBot: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bubbleUser: {
    alignSelf: "flex-end",
    backgroundColor: "#E05326",
  },
  bubbleTextBot: {
    fontSize: 14,
    lineHeight: 20,
    color: "#111827",
  },
  bubbleTextUser: {
    fontSize: 14,
    lineHeight: 20,
    color: "#FFFFFF",
  },
  errorBubble: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  retryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B91C1C",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: "#6B7280",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: "#FFFFFF",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#E05326",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});

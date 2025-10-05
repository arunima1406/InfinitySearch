import { useUser } from "@clerk/clerk-expo";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { spacing } from "../utils/styles";

const { width } = Dimensions.get("window");
const isSmallDevice = width < 375;

interface SearchBarProps {
  onResults: (results: any[]) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onResults,
  placeholder = "Search files...",
}) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const focusAnim = useRef(new Animated.Value(0)).current;

  if (!isLoaded || !isSignedIn) return null;
  const userId = user.id;

  // Animate border when focusing/unfocusing input
  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

 const handleSearch = async () => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return;

  setIsLoading(true);
  try {
    const payload = {
      user_id: userId,
      query: trimmedQuery,
    };

    const response = await fetch("https://28d2575fe97e.ngrok-free.app/user-query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("RAG Raw Response:", data);

    // Normalize data.episodes to always be an array.
    const episodes = Array.isArray(data.episodes)
      ? data.episodes
      : data.episodes
      ? [data.episodes]
      : [];

    console.log("Parsed Episodes:", episodes);

    const results = episodes.map((ep: any, index: number) => ({
      fileName: ep.source_file || `Unknown file ${index + 1}`,
      fileType: ep.file_type || "N/A",
      relevanceScore: typeof ep.score === "number" ? ep.score : 0,
      snippet: ep.summary || "No summary available.",
      metadata: {
        fileSize: 0,
        uploadDate: new Date().toISOString(),
        pageCount: undefined,
      },
      highlightedText: ep.summary ? ep.summary.slice(0, 120) + "..." : "",
    }));

    console.log("Formatted RAG Results:", results);
    onResults(results);
  } catch (error) {
    console.error("Search error:", error);
  } finally {
    setIsLoading(false);
  }
};



  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E0E0E0", "#7C3AED"],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.searchContainer, { borderColor }]}>
        <View style={styles.searchIconContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
        </View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor="#9B9B9B"
          onSubmitEditing={handleSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />

        {query.length > 0 && !isLoading && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.6}
          >
            <View style={styles.clearButtonCircle}>
              <Text style={styles.clearButtonText}>×</Text>
            </View>
          </TouchableOpacity>
        )}

        {query.trim().length > 0 && (
          <TouchableOpacity
            style={[
              styles.searchButton,
              isLoading && styles.searchButtonDisabled,
            ]}
            onPress={handleSearch}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.loadingDot} />
                <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
                <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
              </View>
            ) : (
              <Text style={styles.searchButtonText}>Go</Text>
            )}
          </TouchableOpacity>
        )}
      </Animated.View>

      {isFocused && query.length === 0 && (
        <View style={styles.quickTips}>
          <Text style={styles.quickTipsText}>
            💡 Try natural language like "meeting notes from last week"
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIconContainer: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: {
    fontSize: 20,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: isSmallDevice ? 15 : 16,
    color: "#1A1A1A",
    paddingVertical: 12,
    paddingRight: 8,
    fontWeight: "500",
  },
  clearButton: {
    padding: 8,
    marginRight: 4,
  },
  clearButtonCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 20,
    color: "#6B6B6B",
    lineHeight: 22,
    fontWeight: "400",
  },
  searchButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonDisabled: {
    backgroundColor: "#C4B5FD",
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    opacity: 0.4,
  },
  loadingDotDelay1: {
    opacity: 0.7,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
  quickTips: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F0E7FE",
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#7C3AED",
  },
  quickTipsText: {
    fontSize: 13,
    color: "#5B21B6",
    lineHeight: 18,
    fontWeight: "500",
  },
});

export default SearchBar;

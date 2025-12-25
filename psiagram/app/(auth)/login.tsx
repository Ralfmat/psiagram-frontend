import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { 
  Dimensions, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  Alert,
  ActivityIndicator
} from "react-native";

export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email, password);
      router.replace("/"); 
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.root}>

          <Image
            source={require("@/assets/images/logo_psiagram.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.subtitle}>
            welcome to Psiagram!{"\n"}
            connect, share, and celebrate{"\n"}
            life with your furry friends.
          </Text>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#555" />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email"
                placeholderTextColor="#555"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="eye-outline" size={18} color="#555" />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="password"
                placeholderTextColor="#555"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.forgotWrapper}
              onPress={() => router.push("/(auth)/forgotPassword")}
            >
              <Text style={styles.linkText}>forgot your password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>log in</Text>
              )}
            </TouchableOpacity>

            <View style={styles.bottomTextWrapper}>
              <Text style={styles.bottomText}>
                don't have an account yet?
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/register")}
              >
                <Text style={styles.bottomLink}>sign up now!</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  root: {
    flex: 1,
    backgroundColor: "#FAF7F0", 
    paddingTop: height*0.12,
    alignItems: "center",
  },
  logo: {
    width: width * 0.7,
    height: undefined,
    aspectRatio: 1,     
    marginBottom: height * 0.04,
  },
  subtitle: {
    textAlign: "right",
    fontSize: 16,
    color: "#0B380C",
    marginTop: -height * 1/7,
    marginRight: -width * 0.2,
    marginBottom: height * 0.05,
  },
  fieldContainer: {
    width: width * 0.8,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#5F7751",
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000000ff",
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    marginLeft: 8,
  },
  forgotWrapper: {
    alignSelf: "flex-start",
    marginTop: 6,
    marginBottom: 18,
  },
  linkText: {
    fontSize: 13,
    color: "#969696",
    textDecorationLine: "underline",
  },
  primaryButton: {
    alignSelf: "flex-end",
    backgroundColor: "#69324C", 
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 10,
    marginBottom: 30,
    minWidth: 120,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "lowercase",
  },
  bottomTextWrapper: {
    alignItems: "flex-start",
  },
  bottomText: {
    fontSize: 13,
    color: "#0B380C",
    textAlign: "right",
  },
  bottomLink: {
    fontSize: 13,
    alignSelf: "flex-start",
    color: "#0B380C",
    fontWeight: "600",
    textDecorationLine: "underline"
  },
});
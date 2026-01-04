import client from "@/api/client"; // Use the client instance
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

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required.");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        email,
        username,
        first_name: firstName,
        last_name: lastName,
        password1: password,
        password2: password,
        birth_date: birthDate,
      };

      await client.post("/api/auth/registration/", payload);
      
      Alert.alert("Success", "Account created! Please log in.");
      router.push("/(auth)/login");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      // Extract error message from Django response if available
      const msg = error.response?.data 
        ? JSON.stringify(error.response.data) 
        : "Something went wrong. Please try again.";
      Alert.alert("Registration Failed", msg);
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

          <Text style={styles.subtitle}>create an account</Text>
          <View style={styles.line} />

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#555" />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email"
                placeholderTextColor="#555"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#555" />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor="#555"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>birth date</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="today-outline" size={18} color="#555" />
              <TextInput
                style={styles.input}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="yyyy-mm-dd"
                placeholderTextColor="#555"
              />
            </View>
          </View>
          
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>First name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#555" />
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First Name"
                placeholderTextColor="#555"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Last name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#555" />
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last Name"
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
              style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>sign up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.bottomTextWrapper}>
              <Text style={styles.bottomText}>
                already have an account?
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.bottomLink}>log in</Text>
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
  line: {
    height: 1,
    backgroundColor: "#0B380C",
    width: "80%",
    marginBottom: 30,
  },
  subtitle: {
    fontSize: 16,
    color: "#0B380C",
    fontWeight: "bold",
    marginTop: -height * 1/7,
    marginRight: width * 0.2,
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
  primaryButton: {
    alignSelf: "flex-end",
    backgroundColor: "#69324C", 
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 10,
    marginTop: 15,
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
    marginTop: 10,
  },
  bottomLink: {
    fontSize: 13,
    alignSelf: "flex-start",
    color: "#0B380C",
    fontWeight: "600",
    textDecorationLine: "underline"
  },
});
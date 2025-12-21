import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


export default function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");


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
                placeholder="dd-mm-yyyy"
                placeholderTextColor="#555"
              />
            </View>
          </View>
          

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#555" />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor="#555"
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
              style={styles.primaryButton}
              // tutaj sprawdzić czy dane ok i dodać nowego uzytkownika
              onPress={()=>router.push("/(auth)/login")}
            >
              <Text style={styles.primaryButtonText}>sign up</Text>
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
  scrollContainer: {
    flexGrow: 1,
  },
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
  icon: {
    marginRight: 8,
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
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
    marginTop: 15,

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

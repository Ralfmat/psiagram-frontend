import { useSession } from "@/context/ctx";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";


export default function LoginScreen() {
  const { signIn } = useSession();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  const handleLogin = () => {
    // sprawdzić czy hasla sie zgadzają i są ok
    signIn();
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

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>new password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="eye-outline" size={18} color="#555" />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="new password"
                placeholderTextColor="#555"
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.fieldContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="eye-outline" size={18} color="#555" />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="confirm new password"
                placeholderTextColor="#555"
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLogin}
            >
              <Text style={styles.primaryButtonText}>log in</Text>
            </TouchableOpacity>

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


});

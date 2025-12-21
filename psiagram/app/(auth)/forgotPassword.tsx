import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import OtpInput from "../../components/verifyCode";


export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [popoutVisible, setPopoutVisible] = useState(false);
  const [code, setCode] = useState("");


  const handleSubmitEmail = () => {
    // tu wysylanie maila (??)
    // spawdzenie czy cod poprawny(??)

    setPopoutVisible(true);
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

          <Text style={styles.forgotYourPassword}>
            forgot your password?
          </Text>

          <View style={styles.line} />

          <Text style={styles.dontWorry}>don't worry. we'll help you reset it.</Text>

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
                />
              </View>

              <Text style={styles.enterYourEmail}>
                enter your email to get a verification code.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSubmitEmail}>
                <Text style={styles.primaryButtonText}>confirm</Text>
              </TouchableOpacity>

              <Text style={styles.bottomText}>
               have remembered your password?
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/login")}>

                <Text style={styles.bottomLink}>log in</Text>
              </TouchableOpacity>
            </View>



          <Modal
            visible={popoutVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setPopoutVisible(false)}
          >
            <Pressable
              style={styles.backdrop}
              onPress={() => setPopoutVisible(false)}
            >
              <Pressable style={styles.popoutCard} onPress={() => {}}>
                <Text style={styles.popoutTitle}>enter your verification code here</Text>
                 
                <OtpInput length={6} onChangeCode={setCode} />
                <Text style={{ textAlign: "center", marginTop: 16 }}>
                </Text>
                
                <TouchableOpacity
                  style={styles.popoutButton}
                  onPress={() => {setPopoutVisible(false);
                     router.push("/(auth)/resetPassword");}
                  }
                >
                  <Text style={styles.primaryButtonText}>confirm</Text>
                </TouchableOpacity>

                <Text style={styles.bottomText}>didn't get a code?</Text>
                  <TouchableOpacity>
                                        
                  <Text style={styles.bottomLink}>resend</Text>
                </TouchableOpacity>

              </Pressable>
            </Pressable>
          </Modal>


        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40
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
    width: "70%"
  },
  forgotYourPassword: {
    fontSize: 18,
    color: "#0B380C",
    fontWeight: "bold",
    marginTop: -height * 1/7,
    marginRight: width * 0.2,
  },
  dontWorry: {
    fontSize: 14,
    color: "#5F7751",
    marginRight: width * 0.13,
    marginBottom: height * 0.07,
  },
  enterYourEmail: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center"

  },
    fieldContainer: {
    width: width * 0.8,
    marginBottom: 16,
  },
   fieldLabel: {
    fontSize: 14,
    color: "#5F7751"
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
    marginBottom: 30,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "lowercase",
  },
    bottomText: {
    fontSize: 13,
    color: "#0B380C",
    textAlign: "right",
    alignSelf: "flex-start",

  },
  bottomLink: {
    fontSize: 13,
    alignSelf: "flex-start",
    color: "#0B380C",
    fontWeight: "600",
    textDecorationLine: "underline"
  },


  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  popoutCard: {
    backgroundColor: "#FAF7F0",
    borderRadius: 16,
    padding: 16,
  },
  popoutTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0B380C",
    marginBottom: 8,
    textAlign: "center",
  },
  popoutBody: {
    fontSize: 13,
    color: "#333",
    marginBottom: 16,
  },
   popoutButton: {
    alignSelf: "center",
    backgroundColor: "#69324C", 
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 10,
    marginTop: 1,
    bottom: 10,
  },
  popoutPrimaryText: {
    color: "#fff",
    fontWeight: "600",
  },

});
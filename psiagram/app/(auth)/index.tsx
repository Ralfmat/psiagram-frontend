import { router } from "expo-router";
import { useEffect } from "react";
import { Dimensions, Image, StyleSheet, View } from "react-native";


export default function StartScreen() {

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/(auth)/login");
    }, 3000); // 4.5s

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/logo_psiagram.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Image
        source={require("@/assets/images/piesek_ladowanie.gif")}
        style={styles.gif}
        resizeMode="contain"
      />
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF7F0",
  },
  logo: {
    width: width * 0.8,
    height: undefined,
    aspectRatio: 1,     
    marginBottom: height * 0.03,
  },
  gif: {
    width: width * 0.3,
    height: undefined,
    aspectRatio: 1.662,
    marginTop: -height * 0.15,
  },

});


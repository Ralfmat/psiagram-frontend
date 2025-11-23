import { router } from "expo-router";
import { Button, Text, View, Alert, TextInput } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    //  logowanie 
    if (!email || !password) {
        Alert.alert("blad", "wypelnij pola");
        return;
    }
    setIsLoading(true);

    try{
      await login(email,password);
    }
    catch(e){
      console.error(e)
    }
    finally{
      setIsLoading(false)
    }
  };

  return (
    <View>
      <Text>Login</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Hasło"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Log in" onPress={handleLogin} />

      <Button
        title="Forgot password?"
        onPress={() => router.push("/(auth)/forgotPassword")}
      />

      <Button
        title="Don't have an account? Sign up"
        onPress={() => router.push("/(auth)/register")}
      />
    </View>
  );
}

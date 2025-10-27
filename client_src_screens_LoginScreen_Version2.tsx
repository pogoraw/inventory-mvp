import React, { useState } from "react";
import { View, Text, TextInput, Button } from "react-native";
import { login, setToken } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen({ navigation }: any) {
  const [username, setUsername] = useState("manager");
  const [loading, setLoading] = useState(false);
  async function doLogin() {
    setLoading(true);
    try {
      const res: any = await login(username);
      await AsyncStorage.setItem("token", res.token);
      setToken(res.token);
      navigation.replace("Dashboard");
    } catch (e) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <View style={{ padding: 16 }}>
      <Text>Username (use "manager" or "worker")</Text>
      <TextInput value={username} onChangeText={setUsername} style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <Button title={loading ? "Logging..." : "Login"} onPress={doLogin} />
    </View>
  );
}
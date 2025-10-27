import React from "react";
import { View, Text, Button } from "react-native";

export default function Dashboard({ navigation }: any) {
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 12 }}>Dashboard (MVP)</Text>
      <Button title="Products" onPress={() => navigation.navigate("Products")} />
      <View style={{ height: 8 }} />
      <Button title="Create Shipment (Demo)" onPress={() => navigation.navigate("Shipment")} />
    </View>
  );
}
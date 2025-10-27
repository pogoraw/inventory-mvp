import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/screens/LoginScreen";
import Dashboard from "./src/screens/Dashboard";
import ProductsScreen from "./src/screens/ProductsScreen";
import ShipmentScreen from "./src/screens/ShipmentScreen";
import { initLocalDb } from "./src/db";

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    initLocalDb();
  }, []);
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="Products" component={ProductsScreen} />
        <Stack.Screen name="Shipment" component={ShipmentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
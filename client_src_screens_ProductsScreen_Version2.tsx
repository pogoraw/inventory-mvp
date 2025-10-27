import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { getProducts } from "../services/api";

export default function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const p = await getProducts();
        setProducts(p);
      } catch (e) {
        console.log(e);
        alert("Could not fetch products (server may be offline)");
      }
    })();
  }, []);
  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18 }}>Products</Text>
      <FlatList
        data={products}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={{ padding: 8, borderBottomWidth: 1 }}>
            <Text>{item.title} ({item.sku})</Text>
            <Text>Qty: {item.quantity} | Price: {item.price}</Text>
            <Text>Location: {item.location} | Expiry: {item.expiry_date}</Text>
          </View>
        )}
      />
    </View>
  );
}
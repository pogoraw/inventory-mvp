import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList } from "react-native";
import { createShipment, updateShipmentStatus } from "../services/api";
import { v4 as uuidv4 } from "uuid";

/*
 Simple shipment screen:
 - add SKU via text input (simulates scanner)
 - list items
 - Save shipment (POST)
 - Send Now: mark as delivered and request server to decrement stock
*/

export default function ShipmentScreen({ navigation }: any) {
  const [sku, setSku] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [shipmentId, setShipmentId] = useState<string | null>(null);

  function addSku() {
    if (!sku) return;
    setItems(prev => {
      const found = prev.find(p => p.sku === sku);
      if (found) {
        return prev.map(p => p.sku === sku ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { id: uuidv4(), sku, qty: 1 }];
    });
    setSku("");
  }

  async function saveShipment() {
    setSaving(true);
    try {
      const res: any = await createShipment({ shipment_number: `S-${Date.now()}`, client: "Demo Client", status: "draft", items });
      setShipmentId(res.id);
      alert("Shipment saved as draft. ID: " + res.id);
    } catch (e: any) {
      alert("Save failed: " + (e.message || e));
    } finally {
      setSaving(false);
    }
  }

  async function sendNow() {
    if (!shipmentId) {
      alert("Save shipment first");
      return;
    }
    try {
      // move to delivered with sendNow=true so server decrements inventory
      await updateShipmentStatus(shipmentId, "delivered", true);
      alert("Shipment sent and inventory updated (if server accepted).");
    } catch (e: any) {
      alert("Send failed: " + (e.message || e));
    }
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18 }}>Create Shipment</Text>
      <TextInput placeholder="Scan or enter SKU" value={sku} onChangeText={setSku} style={{ borderWidth: 1, marginVertical: 8, padding: 8 }} />
      <Button title="Add SKU" onPress={addSku} />
      <FlatList data={items} keyExtractor={i=>i.id} renderItem={({item})=>(
        <View style={{ padding:8, borderBottomWidth:1 }}>
          <Text>{item.sku} — qty {item.qty}</Text>
        </View>
      )} />
      <View style={{ height: 8 }} />
      <Button title={saving ? "Saving..." : "Save Shipment (Draft)"} onPress={saveShipment} />
      <View style={{ height: 8 }} />
      <Button title="Send Now (decrease stock)" onPress={sendNow} />
    </View>
  );
}
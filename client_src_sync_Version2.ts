import { executeSqlAsync } from "./db";
import { sync as apiSync } from "./services/api";
import { v4 as uuidv4 } from "uuid";

/*
 Simple sync: read local changelog entries and push to server, then apply server response (products list).
*/
export async function trySync(clientId: string) {
  // read local changelog
  const rows: any = await executeSqlAsync("SELECT * FROM changelog");
  const changes = [];
  for (let i = 0; i < rows.rows.length; i++) {
    changes.push(rows.rows.item(i));
  }
  if (changes.length === 0) return;
  const res = await apiSync(clientId, changes);
  // apply server products (replace local products table — simplistic)
  if (res && res.products) {
    await executeSqlAsync("DELETE FROM products");
    const insert = async (p: any) => {
      await executeSqlAsync(`INSERT INTO products (id, sku, title, price, manufacturer_barcode, supplier_sku, location, quantity, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.id, p.sku, p.title, p.price || 0, p.manufacturer_barcode || null, p.supplier_sku || null, p.location || null, p.quantity || 0, p.expiry_date || null]);
    };
    for (const p of res.products) {
      await insert(p);
    }
    // clear changelog
    await executeSqlAsync("DELETE FROM changelog");
  }
}
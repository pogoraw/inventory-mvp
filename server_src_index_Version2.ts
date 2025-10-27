import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { db, nowISO } from "./db";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

// Simple auth: login with username "manager" or "worker", no password for prototype
app.post("/auth/login", (req, res) => {
  const { username } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) return res.status(401).json({ error: "Invalid user" });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// middleware to check token
function authMiddleware(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "No token" });
  const token = auth.replace("Bearer ", "");
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Products
app.get("/products", authMiddleware, (req, res) => {
  const rows = db.prepare("SELECT * FROM products").all();
  res.json(rows);
});

app.post("/products", authMiddleware, (req, res) => {
  const p = req.body;
  const id = uuidv4();
  const stmt = db.prepare(`INSERT INTO products (id, sku, title, price, manufacturer_barcode, supplier_sku, location, quantity, expiry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  stmt.run(id, p.sku, p.title, p.price || 0, p.manufacturer_barcode || null, p.supplier_sku || null, p.location || null, p.quantity || 0, p.expiry_date || null);
  res.json({ id });
});

app.put("/products/:id", authMiddleware, (req, res) => {
  const id = req.params.id;
  const p = req.body;
  const stmt = db.prepare(`UPDATE products SET sku=?, title=?, price=?, manufacturer_barcode=?, supplier_sku=?, location=?, quantity=?, expiry_date=? WHERE id=?`);
  stmt.run(p.sku, p.title, p.price, p.manufacturer_barcode, p.supplier_sku, p.location, p.quantity, p.expiry_date, id);
  res.json({ ok: true });
});

// Shipments
app.get("/shipments", authMiddleware, (req, res) => {
  const rows = db.prepare("SELECT * FROM shipments ORDER BY created_at DESC").all();
  res.json(rows);
});

app.post("/shipments", authMiddleware, (req, res) => {
  const s = req.body;
  const id = uuidv4();
  const created_at = nowISO();
  db.prepare(`INSERT INTO shipments (id, shipment_number, client, carrier, tracking_number, notes, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, s.shipment_number || null, s.client || null, s.carrier || null, s.tracking_number || null, s.notes || null, s.status || "draft", req.user.id, created_at);
  if (Array.isArray(s.items)) {
    const insertItem = db.prepare("INSERT INTO shipment_items (id, shipment_id, product_id, sku, qty) VALUES (?, ?, ?, ?, ?)");
    for (const it of s.items) {
      insertItem.run(uuidv4(), id, it.product_id || null, it.sku || null, it.qty || 1);
    }
  }
  res.json({ id });
});

// Update shipment status; if sendNow=true and status moves to 'delivered', decrement stock atomically
app.put("/shipments/:id/status", authMiddleware, (req, res) => {
  const id = req.params.id;
  const { status, sendNow } = req.body;
  const tx = db.transaction(() => {
    const now = nowISO();
    const updateStmt = db.prepare("UPDATE shipments SET status=?, shipped_at=?, delivered_at=? WHERE id=?");
    if (status === "shipped") updateStmt.run(status, now, null, id);
    else if (status === "delivered") updateStmt.run(status, null, now, id);
    else updateStmt.run(status, null, null, id);

    if (sendNow && status === "delivered") {
      // decrement inventory for items in this shipment
      const items = db.prepare("SELECT * FROM shipment_items WHERE shipment_id = ?").all(id);
      for (const it of items) {
        const prod = db.prepare("SELECT * FROM products WHERE id = ? OR sku = ?").get(it.product_id, it.sku);
        if (!prod) throw new Error("Product not found for shipment item: " + it.id);
        const newQty = (prod.quantity || 0) - it.qty;
        if (newQty < 0) throw new Error("Insufficient stock for SKU: " + (prod.sku || prod.id));
        db.prepare("UPDATE products SET quantity = ? WHERE id = ?").run(newQty, prod.id);
      }
    }
  });
  try {
    tx();
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Simple sync: client posts changelog entries; server applies naive; returns all server state (simplified)
app.post("/sync", authMiddleware, (req, res) => {
  const { clientId, changes } = req.body;
  if (Array.isArray(changes)) {
    const insert = db.prepare("INSERT INTO changelog (id, client_id, entity_type, entity_id, operation, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const c of changes) {
      insert.run(c.id || uuidv4(), clientId || "unknown", c.entity_type, c.entity_id, c.operation, JSON.stringify(c.payload || {}), c.timestamp || nowISO());
      // Naive apply for a few entity types
      try {
        if (c.entity_type === "product") {
          const payload = c.payload;
          if (c.operation === "upsert") {
            const exists = db.prepare("SELECT id FROM products WHERE id = ? OR sku = ?").get(payload.id, payload.sku);
            if (exists) {
              db.prepare("UPDATE products SET sku=?, title=?, price=?, manufacturer_barcode=?, supplier_sku=?, location=?, quantity=?, expiry_date=? WHERE id=?")
                .run(payload.sku, payload.title, payload.price || 0, payload.manufacturer_barcode || null, payload.supplier_sku || null, payload.location || null, payload.quantity || 0, payload.expiry_date || null, exists.id);
            } else {
              db.prepare("INSERT INTO products (id, sku, title, price, manufacturer_barcode, supplier_sku, location, quantity, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
                .run(payload.id || uuidv4(), payload.sku, payload.title, payload.price || 0, payload.manufacturer_barcode || null, payload.supplier_sku || null, payload.location || null, payload.quantity || 0, payload.expiry_date || null);
            }
          }
        }
      } catch (err) {
        // swallow in prototype
        console.error("apply change error", err);
      }
    }
  }
  // return current products and shipments as server changes (full sync simple)
  const products = db.prepare("SELECT * FROM products").all();
  const shipments = db.prepare("SELECT * FROM shipments").all();
  res.json({ serverTime: nowISO(), products, shipments });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("Server listening on", PORT);
});
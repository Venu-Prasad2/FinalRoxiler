const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");

const app = express();
app.use(cors());

const dbPath = path.join(__dirname, "amazon.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        price REAL,
        description TEXT,
        category TEXT,
        image TEXT,
        sold INTEGER,
        dateOfSale TEXT
      );
    `);
    app.listen(3000, () => console.log("Server Running at http://localhost:3000/"));
  } catch (e) {
    console.error(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const fetchAndStoreData = async () => {
  try {
    const response = await fetch("https://s3.amazonaws.com/roxiler.com/product_transaction.json");
    const transactions = await response.json();

    for (const { title, price, description, category, image, sold, dateOfSale } of transactions) {
      const isSold = sold === "true" || sold === true ? 1 : 0;
      const imageUrl = image || "default-image.jpg";

      const insertProductQuery = `
        INSERT INTO products (title, price, description, category, image, sold, dateOfSale) 
        VALUES (${title}, ${price}, ${description}, ${category}, ${image}, ${isSold}, ${dateOfSale});
      `;
      await db.run(insertProductQuery);
    }
    console.log("Database populated with products.");
  } catch (e) {
    console.error("Error fetching or storing data: ", e.message);
  }
};

app.get("/api/init-db", async (req, res) => {
  try {
    await fetchAndStoreData();
    res.status(200).send("Database initialized and populated with products.");
  } catch (e) {
    res.status(500).send("Error initializing the database: " + e.message);
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const { search = "", page = 1, perPage = 10 } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(perPage, 10);
    const searchTerm = `%${search}%`;

    const fetchProductsQuery = `
      SELECT * FROM products
      WHERE title LIKE ? OR description LIKE ? OR CAST(price AS TEXT) LIKE ?
      LIMIT ? OFFSET ?;
    `;
    const products = await db.all(fetchProductsQuery, [searchTerm, searchTerm, searchTerm, perPage, offset]);

    const countQuery = `
      SELECT COUNT(*) AS count FROM products
      WHERE title LIKE ? OR description LIKE ? OR CAST(price AS TEXT) LIKE ?;
    `;
    const countResult = await db.get(countQuery, [searchTerm, searchTerm, searchTerm]);

    res.status(200).json({
      products,
      pagination: {
        totalCount: countResult.count,
        totalPages: Math.ceil(countResult.count / perPage),
        currentPage: parseInt(page, 10),
        perPage: parseInt(perPage, 10),
      },
    });
  } catch (e) {
    res.status(500).send("Error fetching products: " + e.message);
  }
});

app.get("/api/statistics", async (req, res) => {
  try {
    let { month } = req.query;

    
    if (!month || month.trim() === "") {
      month = "03";
    }

    console.log("Fetching statistics for month:", month); 

    const statsQuery = `
      SELECT 
        COALESCE(SUM(price), 0) AS totalSaleAmount, 
        (SELECT COUNT(*) FROM products WHERE sold = 1 AND strftime('%m', dateOfSale) = ?) AS totalSoldItems, 
        (SELECT COUNT(*) FROM products WHERE sold = 0 AND strftime('%m', dateOfSale) = ?) AS totalNotSoldItems
      FROM products 
      WHERE strftime('%m', dateOfSale) = ?;
    `;

    const stats = await db.get(statsQuery, [month, month, month]);

    res.json({
      totalSaleAmount: stats?.totalSaleAmount || 0,
      totalSoldItems: stats?.totalSoldItems || 0,
      totalNotSoldItems: stats?.totalNotSoldItems || 0
    });

  } catch (e) {
    console.error("Error fetching statistics:", e.message);
    res.status(500).json({ error: "Error fetching statistics: " + e.message });
  }
});




app.get("/api/price-range-statistics", async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).send("Month parameter required.");

    const priceRangeQuery = `
      SELECT 
        COUNT(CASE WHEN price BETWEEN 0 AND 100 THEN 1 END) AS "0-100",
        COUNT(CASE WHEN price BETWEEN 101 AND 200 THEN 1 END) AS "101-200",
        COUNT(CASE WHEN price BETWEEN 201 AND 300 THEN 1 END) AS "201-300",
        COUNT(CASE WHEN price BETWEEN 301 AND 400 THEN 1 END) AS "301-400",
        COUNT(CASE WHEN price BETWEEN 401 AND 500 THEN 1 END) AS "401-500",
        COUNT(CASE WHEN price >= 501 THEN 1 END) AS "501-above"
      FROM products 
      WHERE strftime('%m', dateOfSale) = ?;
    `;
    const result = await db.get(priceRangeQuery, [month]);

    res.json(result);
  } catch (e) {
    res.status(500).send("Error fetching price range statistics: " + e.message);
  }
});

app.get("/api/category-statistics", async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).send("Month parameter required.");

    const categoryQuery = `
      SELECT category, COUNT(*) AS itemCount 
      FROM products 
      WHERE strftime('%m', dateOfSale) = ? 
      GROUP BY category;
    `;
    const categories = await db.all(categoryQuery, [month]);

    res.json(categories);
  } catch (e) {
    res.status(500).send("Error fetching category statistics: " + e.message);
  }
});

app.get("/api/combined-statistics", async (req, res) => {
  try {
    let { month } = req.query;

    
    if (!month || month.trim() === ""){
      month = "03";
    }

    console.log("Fetching combined statistics for month:", month); 

    
    const statsQuery = `
      SELECT 
        COALESCE(SUM(price), 0) AS totalSaleAmount, 
        (SELECT COUNT(*) FROM products WHERE sold = 1 AND strftime('%m', dateOfSale) = ?) AS totalSoldItems, 
        (SELECT COUNT(*) FROM products WHERE sold = 0 AND strftime('%m', dateOfSale) = ?) AS totalNotSoldItems
      FROM products 
      WHERE strftime('%m', dateOfSale) = ?;
    `;
    const stats = await db.get(statsQuery, [month, month, month]);

   
    const priceRangeQuery = `
      SELECT 
        COUNT(CASE WHEN price BETWEEN 0 AND 100 THEN 1 END) AS "0-100",
        COUNT(CASE WHEN price BETWEEN 101 AND 200 THEN 1 END) AS "101-200",
        COUNT(CASE WHEN price BETWEEN 201 AND 300 THEN 1 END) AS "201-300",
        COUNT(CASE WHEN price BETWEEN 301 AND 400 THEN 1 END) AS "301-400",
        COUNT(CASE WHEN price BETWEEN 401 AND 500 THEN 1 END) AS "401-500",
        COUNT(CASE WHEN price >= 501 THEN 1 END) AS "501-above"
      FROM products 
      WHERE strftime('%m', dateOfSale) = ?;
    `;
    const priceRanges = await db.get(priceRangeQuery, [month]);

  
    const categoryQuery = `
      SELECT category, COUNT(*) AS itemCount 
      FROM products 
      WHERE strftime('%m', dateOfSale) = ? 
      GROUP BY category;
    `;
    const categories = await db.all(categoryQuery, [month]);

    res.json({
      statistics: {
        totalSaleAmount: stats?.totalSaleAmount || 0,
        totalSoldItems: stats?.totalSoldItems || 0,
        totalNotSoldItems: stats?.totalNotSoldItems || 0,
      },
      priceRangeStatistics: priceRanges || {},
      categoryStatistics: categories || [],
    });

  } catch (e) {
    console.error("Error fetching combined statistics:", e.message);
    res.status(500).json({ error: "Error fetching combined statistics: " + e.message });
  }
});

module.exports = app;

const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Shutting down...");
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB connection successful!"));

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION!  Shutting down...");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// const mongoose = require("mongoose");
// const dotenv = require("dotenv");
// const serverless = require("serverless-http");

// // Load biến môi trường
// dotenv.config({ path: "./config.env" });

// // Load express app
// const app = require("./app");

// // Kết nối MongoDB — chỉ kết nối 1 lần (để tránh reconnect mỗi lần Vercel gọi hàm)
// let isConnected = false;

// const connectDB = async () => {
//   if (isConnected) return;

//   const DB = process.env.DATABASE.replace(
//     "<PASSWORD>",
//     process.env.DATABASE_PASSWORD
//   );

//   try {
//     await mongoose.connect(DB);
//     isConnected = true;
//     console.log("MongoDB connected ✅");
//   } catch (err) {
//     console.error("MongoDB connection error ❌", err);
//     throw err;
//   }
// };

// // Custom handler cho Vercel (gọi connectDB trước khi xử lý request)
// const handler = async (req, res) => {
//   await connectDB();
//   return serverless(app)(req, res);
// };

// module.exports = handler;

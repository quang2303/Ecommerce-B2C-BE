const express = require("express");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
// const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const engine = require("ejs-mate");

const AppError = require("./utils/appError");
// const globalErrorHandler = require("./controllers/errorController");
const productRouter = require("./routes/productRoutes");
const userRouter = require("./routes/userRoutes");
const categoryRouter = require("./routes/categoryRoutes");
const brandRouter = require("./routes/brandRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const orderRouter = require("./routes/orderRoutes");
const importRouter = require("./routes/importRoutes");
const commentRouter = require("./routes/commentRoutes");
const viewRouter = require("./routes/viewRoutes");
const transactionRouter = require("./routes/transactionRoutes");
const locationRouter = require("./routes/locationRoutes");

const app = express();
app.engine("ejs", engine);
app.set("view engine", "ejs");
// Add headers before the routes are defined
app.use(
  cors({
    origin: ["https://ptstore.vercel.app/"], // Thêm origin của bạn
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"], // Quan trọng!
    exposedHeaders: ["Authorization"], // Cho phép client đọc header
    credentials: true, // Nếu dùng cookie
  })
);
// Serving static files
// app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/bootstrap",
  express.static(__dirname + "/node_modules/bootstrap/dist/")
);
app.use("/text", express.static(__dirname + "/node_modules/tinymce/"));
// 1) GLOBAL MIDDLEWARE
// Set security HTTP headers
// app.use(helmet());
app.use(cookieParser());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ["ratingsQuantity", "ratingsAverage", "price"],
  })
);

// Serving static files
app.use(express.static(`${__dirname}/views`));
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// 3) ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/imports", importRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/payments", transactionRouter);
app.use("/api/v1/locations", locationRouter);
app.use("/", viewRouter);

app.all("*", (req, res, next) => {
  // next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  res.status(200).render("404");
});

app.use((err, req, res, next) => {
  // Đặt status code mặc định nếu chưa có
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log lỗi ra console để debug
  console.error("ERROR 💥:", err);

  // Chỉ gửi stack trace trong môi trường development
  const response = {
    status: err.status,
    message: err.message,
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  // Kiểm tra xem response đã được gửi chưa
  if (res.headersSent) {
    return next(err);
  }

  // Gửi response
  res.status(err.statusCode).json(response);
});

module.exports = app;

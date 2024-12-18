const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
console.log("Email User:", process.env.EMAIL_USER);
console.log("Email Pass is set:", !!process.env.EMAIL_PASS);

const app = express();
const JWT_SECRET = "kutevfydcwvWRULI.OH8GHP9Q385UYHU0-1AGJEOIR";

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json()); // Middleware to parse JSON

// MongoDB connection
const mongoUrl = "mongodb+srv://prathamb0171:racheldhanraj@cluster0.uh4a8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Database connected");
  })
  .catch((e) => {
    console.error("Database connection error:", e);
  });

// User schema and model for registration/login
const UserDetailsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  mobile: { type: String, required: true },
  password: { type: String, required: true },
}, {
  collection: "userInfo"
});
const User = mongoose.model("UserInfo", UserDetailsSchema);

// Setup nodemailer transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Transporter setup failed:", error);
  } else {
    console.log("Transporter is ready to send emails");
  }
});

// Home route
app.get("/", (req, res) => {
  res.send({ status: "Server started" });
});

// Global variables for OTP
let otpCode = null;
let otpExpiryTime = null;

// Send OTP Route
app.post('/send-otp', async (req, res) => {
  const { email: Uemail } = req.body;

  if (!Uemail) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Generate OTP
  otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpExpiryTime = Date.now() + 5 * 60 * 1000;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: Uemail,
    subject: 'Your OTP for Verification',
    text: `Your OTP code is ${otpCode}. This code is valid for 5 minutes.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to send OTP', details: error });
    }
    res.status(200).json({ message: 'OTP sent successfully!' });
  });
});

// Verify OTP Route
app.post('/verify-otp', (req, res) => {
  const { otp } = req.body;

  if (!otpCode || Date.now() > otpExpiryTime) {
    return res.status(400).json({ error: 'OTP has expired or not generated' });
  }

  if (otp === otpCode) {
    return res.status(200).json({ message: 'OTP verified successfully!' });
  }

  return res.status(400).json({ error: 'Invalid OTP' });
});

// User registration route
app.post('/register', async (req, res) => {
  const { name, email, mobile, password } = req.body;

  try {
    const oldUser = await User.findOne({ email });
    if (oldUser) {
      return res.status(400).send({ data: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
    });

    res.send({ status: "ok", data: "User created successfully" });
  } catch (error) {
    res.status(500).send({ status: "error", data: error.message });
  }
});

// User login route
app.post("/login-user", async (req, res) => {
  const { email, password } = req.body;

  try {
    const oldUser = await User.findOne({ email });

    if (!oldUser) {
      return res.status(400).send({ data: "User doesn't exist" });
    }

    const isPasswordValid = await bcrypt.compare(password, oldUser.password);
    if (!isPasswordValid) {
      return res.status(400).send({ data: "Incorrect password" });
    }

    const token = jwt.sign({ email: oldUser.email }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).send({ status: "ok", data: token });
  } catch (error) {
    res.status(500).send({ status: "error", data: error.message });
  }
});

// Route to fetch user data using JWT token
app.post("/userdata", async (req, res) => {
  const { token } = req.body;

  try {
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;

    const data = await User.findOne({ email: useremail });
    if (!data) {
      return res.status(404).send({ status: "error", data: "User not found" });
    }

    return res.send({ status: "ok", data });
  } catch (error) {
    return res.status(401).send({ status: "error", data: "Invalid or expired token" });
  }
});

// Car schema and model
const carSchema = new mongoose.Schema({
  regno: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: String, required: true },
  price: { type: Number, required: true },
  ownerNo: { type: String },
  transmission: { type: String, required: true },
  fuelType: { type: String, required: true },
  seats: { type: Number, required: true },
  askableprice: { type: String, required: true },
  description: { type: String, required: true },
  images: [String],
  owner: {
    ownerName: { type: String, required: true },
    adharNumber: { type: String },
    ownerComments: { type: String },
    whatsappNumber: { type: String, required: true },
  },
});

const Car = mongoose.model("Car", carSchema);

// Add-car route
app.post('/add-car', async (req, res) => {
  const { regno, model, year, price, ownerNo, transmission, fuelType, seats, askableprice, description, images, owner } = req.body;

  try {
    const newCar = new Car({
      regno,
      model,
      year,
      price,
      ownerNo,
      transmission,
      fuelType,
      seats,
      askableprice,
      description,
      images,
      owner,
    });

    await newCar.save();
    res.send({ status: "ok", data: "Car added successfully" });
  } catch (error) {
    res.status(500).send({ status: "error", data: error.message });
  }
});


app.get('/cars', async (req, res) => {

  try {console.log("cardetail fetching 1 api hited ")
    const cars = await Car.find(); // Fetch all cars
    res.json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching car data' });
  }
});


app.get('/cars/:id', async (req, res) => {
  try {
    console.log("Fetching car with ID:", req.params.id);

    if (!req.params.id) {
      return res.status(400).json({ message: 'Car ID is required' });
    }

    const car = await Car.findById(req.params.id);
    console.log('Car object:', car);

    if (!car) {
      return res.status(404).json({ message: 'Car not found' });
    }

    res.json(car);
  } catch (error) {
    console.error('Error while fetching car:', error);
    res.status(500).json({ message: 'Error fetching car data' });
  }
});


// Garage schema and model
const garageSchema = new mongoose.Schema({
  garageName: { type: String, required: true },
  ownerName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  aadhaarCardNumber: { type: String, required: true },
  location: { type: String },
  timings: { type: String, required: true },
  servicesOffered: { type: String },
  image: { type: String },
  contactEmail: { type: String },
  description: { type: String },
  locate: { type: String, required: true },
}, { timestamps: true });

const Garage = mongoose.model("Garage", garageSchema);

// Create-garage route
app.post("/createGarage", async (req, res) => {
  const { garageName, ownerName, contactNumber, aadhaarCardNumber, timings, contactEmail, locate } = req.body;

  if (!garageName || !ownerName || !contactNumber || !aadhaarCardNumber || !timings || !contactEmail || !locate) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields. Please ensure all required fields are filled.',
    });
  }

  try {
    const newGarage = new Garage(req.body);
    await newGarage.save();
    res.status(201).json({ success: true, data: newGarage });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving the garage to the database' });
  }
});

// Get-garages route
app.get("/getGarages", async (req, res) => {
  try {
    const garages = await Garage.find({});
    res.status(200).json({ success: true, data: garages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving garages' });
  }
});



const Product = new mongoose.Schema(
  {
    name: { type: String, required: true },
    adhaarno: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    model: { type: String, required: true },
    price: { type: String, required: true },
    vin: { type: String, required: true },
    licenseno: { type: String, required: true },
    fueltype: { type: String, required: false },
    image: { type: String, required: false },
  },
  { timestamps: true }
);


app.get('/products', async (req, res) => {
  try {
    const products = await Car.find();
    res.status(200).json({ data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});




app.post('/add-products', async (req, res) => {
  console.log("product");
  const product = req.body;
  console.log(product);
  if (!product.name || !product.adhaarno || !product.email || !product.phone ||
      !product.model || !product.price || !product.vin || !product.licenseno ||
      !product.fueltype) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields. Please ensure all fields are filled.',
    });
  }

  const newProduct = new Product(product);

  try {
    await newProduct.save();
    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving the product to the database',
    });
  }
});




app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;  // Extract the ID from URL parameters
    const car = await Product.findById(id);  // Find the car by ID in the database

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car not found',
      });
    }

    res.status(200).json({
      success: true,
      data: car,  // Send the car data in response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving car',
    });
  }
});

// Start the server
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

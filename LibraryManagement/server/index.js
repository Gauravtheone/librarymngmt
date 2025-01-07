// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware setup
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// MongoDB connection
mongoose
  .connect("mongodb+srv://iamgauravsaini8:abcdefgh@cluster0.dby3o.mongodb.net/library?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

// MongoDB Schemas
const bookSchema = new mongoose.Schema({
  title: String,
  author: String,
  publicationYear: Number,
  availabilityStatus: { type: Boolean, default: true },
});

const userSchema = new mongoose.Schema({
  name: String,
  contactInfo: String,
});

const transactionSchema = new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: "Book" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  borrowDate: Date,
  returnDate: Date,
});

const Book = mongoose.model("Book", bookSchema);
const User = mongoose.model("User", userSchema);
const Transaction = mongoose.model("Transaction", transactionSchema);

// API Endpoints

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "YOUR SERVER IS UP AND RUNNING",
  });
});

// CRUD for Books
app.post("/books", async (req, res) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).send(book);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.get("/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.send(books);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put("/books/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).send("Book not found");
    res.send(book);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.delete("/books/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).send("Book not found");
    res.send(book);
  } catch (err) {
    res.status(500).send(err);
  }
});

// CRUD for Users
app.post("/users", async (req, res) => {
  try {
    const { name, contactInfo } = req.body;

    // Check if a user with the same contact info already exists
    const existingUser = await User.findOne({ contactInfo });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered with this contact info." });
    }

    // If not, create a new user
    const user = new User({ name, contactInfo });
    await user.save();

    res.status(201).json(user);
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});


app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Borrow and Return Books
app.post("/borrow", async (req, res) => {
  try {
    const { bookId, userId } = req.body;
    const book = await Book.findById(bookId);
    if (!book || !book.availabilityStatus) return res.status(400).send("Book not available");

    const transaction = new Transaction({ bookId, userId, borrowDate: new Date() });
    await transaction.save();

    book.availabilityStatus = false;
    await book.save();

    res.send(transaction);
  } catch (err) {
    res.status(400).send(err);
  }
});

app.post("/return", async (req, res) => {
  try {
    const { bookId, userId } = req.body;
    const transaction = await Transaction.findOne({ bookId, userId, returnDate: null });
    if (!transaction) return res.status(404).send("Transaction not found");

    transaction.returnDate = new Date();
    await transaction.save();

    const book = await Book.findById(bookId);
    book.availabilityStatus = true;
    await book.save();

    res.send(transaction);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Fetch transactions for a user (optional for analytics)
app.get("/transactions/:userId", async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId })
      .populate("bookId", "title author")
      .populate("userId", "name");
    res.send(transactions);
  } catch (err) {
    res.status(500).send(err);
  }
});
// Fetch all borrowed books for a specific user
app.get("/user/:userId/borrowed-books", async (req, res) => {
  try {
    const { userId } = req.params;
    const transactions = await Transaction.find({ userId })
      .populate("bookId", "title author publicationYear")
      .exec();

    if (!transactions.length) {
      return res.status(404).send({ message: "No borrowed books found for this user." });
    }

    res.send(transactions);
  } catch (err) {
    res.status(500).send(err);
  }
});
// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

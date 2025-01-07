import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000";

function App() {
  const [books, setBooks] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]); // To store user transactions
  const [newBook, setNewBook] = useState({ title: "", author: "", publicationYear: "" });
  const [newUser, setNewUser] = useState({ name: "", contactInfo: "" });
  const [selectedUser, setSelectedUser] = useState("");

  // Fetch all books and users
  const fetchBooks = async () => {
    try {
      const response = await axios.get(`${API_URL}/books`);
      setBooks(response.data);
    } catch (error) {
      console.error("Error fetching books:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`);
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchUsers();
  }, []);

  // Fetch transactions for the selected user
  const fetchTransactions = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/user/${userId}/borrowed-books`);
      if (Array.isArray(response.data)) {
        setTransactions(response.data);
      } else {
        console.error("Unexpected response format:", response.data);
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]); // Clear transactions on error
    }
  };


  // Add a new book
  const addBook = async () => {
    try {
      await axios.post(`${API_URL}/books`, newBook);
      setNewBook({ title: "", author: "", publicationYear: "" });
      fetchBooks();
    } catch (error) {
      console.error("Error adding book:", error);
    }
  };

  // Delete a book
  const deleteBook = async (bookId) => {
    try {
      await axios.delete(`${API_URL}/books/${bookId}`);
      fetchBooks();
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  // Register a new user
  const registerUser = async () => {
    try {
      const response = await axios.post(`${API_URL}/users`, newUser);
      setNewUser({ name: "", contactInfo: "" });
      fetchUsers(); // Refresh the users list
      alert("User registered successfully.");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        alert(error.response.data.message); // Show "User already registered" message
      } else {
        console.error("Error registering user:", error);
        alert("An error occurred. Please try again.");
      }
    }
  };
  

  // Borrow a book
  const borrowBook = async (bookId) => {
    try {
      if (!selectedUser) {
        alert("Please select a user first.");
        return;
      }
      await axios.post(`${API_URL}/borrow`, { bookId, userId: selectedUser });
      fetchBooks();
      fetchTransactions(selectedUser); // Update transactions
    } catch (error) {
      console.error("Error borrowing book:", error);
    }
  };

  // Return a book
  const returnBook = async (bookId) => {
    try {
      if (!selectedUser) {
        alert("Please select a user first.");
        return;
      }
  
      await axios.post(`${API_URL}/return`, { bookId, userId: selectedUser });
  
      // Update the borrowings and books list
      fetchTransactions(selectedUser);
      fetchBooks();
      alert("Book returned successfully.");
    } catch (error) {
      console.error("Error returning book:", error);
      alert("Failed to return the book. Please try again.");
    }
  };
  

  // Handle user selection and fetch their transactions
  const handleUserSelection = (userId) => {
    setSelectedUser(userId);
    if (userId) {
      fetchTransactions(userId); // Fetch transactions for the selected user
    } else {
      setTransactions([]); // Clear transactions if no user is selected
    }
  };
  

  return (
    <div className="App">
      <h1>Library Management System</h1>

      {/* Register User */}
      <div>
        <h2>Register User</h2>
        <input
          type="text"
          placeholder="Name"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Contact Info"
          value={newUser.contactInfo}
          onChange={(e) => setNewUser({ ...newUser, contactInfo: e.target.value })}
        />
        <button onClick={registerUser}>Register User</button>
      </div>

      {/* Select User */}
      <div>
        <h2>Select User</h2>
        <select value={selectedUser} onChange={(e) => handleUserSelection(e.target.value)}>
          <option value="">-- Select User --</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.name}
            </option>
          ))}
        </select>
      </div>

      {/* Display Transactions */}
      <div>
  <h2>Borrowed Books</h2>
  {transactions.length === 0 ? (
    <p>No borrowed books found for this user.</p>
  ) : (
    <ul>
      {transactions.map((transaction) => (
        <li key={transaction._id}>
          <strong>{transaction.bookId?.title || "Unknown Title"}</strong> by{" "}
          {transaction.bookId?.author || "Unknown Author"} (
          {transaction.bookId?.publicationYear || "Unknown Year"}) -{" "}
          {transaction.returnDate
            ? `Returned on ${new Date(transaction.returnDate).toLocaleDateString()}`
            : (
              <>
                Not Returned
                <button
                  onClick={() => returnBook(transaction.bookId._id)}
                  style={{ marginLeft: "10px" }}
                >
                  Return
                </button>
              </>
            )}
        </li>
      ))}
    </ul>
  )}
</div>



      {/* Add Book */}
      <div>
        <h2>Add New Book</h2>
        <input
          type="text"
          placeholder="Title"
          value={newBook.title}
          onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Author"
          value={newBook.author}
          onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
        />
        <input
          type="number"
          placeholder="Publication Year"
          value={newBook.publicationYear}
          onChange={(e) => setNewBook({ ...newBook, publicationYear: e.target.value })}
        />
        <button onClick={addBook}>Add Book</button>
      </div>

      {/* List of Books */}
      <div>
        <h2>Books</h2>
        <ul>
          {books.map((book) => (
            <li key={book._id}>
              <strong>{book.title}</strong> by {book.author} ({book.publicationYear}) -{" "}
              {book.availabilityStatus ? "Available" : "Not Available"}
              <button onClick={() => deleteBook(book._id)}>Delete</button>
              {book.availabilityStatus ? (
                <button onClick={() => borrowBook(book._id)}>Borrow</button>
              ) : (
                <button onClick={() => returnBook(book._id)}>Return</button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;

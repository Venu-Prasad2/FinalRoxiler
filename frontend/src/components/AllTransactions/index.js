import React, { useEffect, useState } from "react";
import { ThreeDots } from "react-loader-spinner"; 
import "./index.css";

const monthMap = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};

const AllTransactions = ({ selectedMonth, onMonthChange }) => {
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `https://finalroxiler-backend.onrender.com/api/products?month=${selectedMonth}&page=${currentPage}&search=${searchQuery}`
        );

        if (!response.ok) throw new Error("Failed to fetch transactions");

        const data = await response.json();
        console.log("Fetched Transactions:", data); 

        setTransactions(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedMonth, currentPage, searchQuery]);

  return (
    <div className="transactions-container">
      <h2 className="transactions-header">All Transactions</h2>

    
      <div className="transactions-controls">
        <select
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="month-select"
        >
          {Object.keys(monthMap).map((month) => (
            <option key={month} value={monthMap[month]}>
              {month}
            </option>
          ))}
        </select>
      </div>

     
      <input
        type="text"
        placeholder="Search by title or category..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />

     
      {loading ? (
        <div className="loader-container">
          <ThreeDots color="#007bff" height={60} width={60} />
        </div>
      ) : error ? (
        <div className="error-text">{error}</div>
      ) : transactions.length > 0 ? (
        <table className="transactions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Price</th>
              <th>Category</th>
              <th>Sold</th>
              <th>Image</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((item) => {
              console.log("Image URL:", item.image); 

              return (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td>{item.description}</td>
                  <td>${item.price.toFixed(2)}</td>
                  <td>{item.category}</td>
                  <td>{item.sold ? "Yes" : "No"}</td>
                  <td>
                    <img
                      src={item.image}
                      alt={item.title}
                      width="50"
                      height="50"
                      className="transaction-image"
                      onError={(e) =>
                        (e.target.src = "https://via.placeholder.com/50")
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="no-data">No transactions found</div>
      )}

      
      <div className="pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AllTransactions;

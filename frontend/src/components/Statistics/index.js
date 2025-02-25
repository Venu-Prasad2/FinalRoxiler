import React, { useEffect, useState } from "react";
import "./index.css";

const monthNames = {
  "01": "January", "02": "February", "03": "March", "04": "April",
  "05": "May", "06": "June", "07": "July", "08": "August",
  "09": "September", "10": "October", "11": "November", "12": "December"
};

const Statistics = ({ selectedMonth }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedMonth) return;

    const fetchStatistics = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`http://localhost:3000/api/statistics?month=${selectedMonth}`);
        if (!response.ok) throw new Error("Failed to fetch statistics");
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [selectedMonth]);

  return (
    <div className="statistics-container">
      <h2>Statistics for {monthNames[selectedMonth] || "Unknown"}</h2>
      
      {loading ? (
        <div>Loading statistics...</div>
      ) : error ? (
        <div className="error-text">{error}</div>
      ) : stats ? (
        <div className="stats-box">
          <p>Total Sales: ${stats.totalSaleAmount?.toFixed(2) || "0.00"}</p>
          <p>Sold Items: {stats.totalSoldItems}</p>
          <p>Unsold Items: {stats.totalNotSoldItems}</p>
        </div>
      ) : (
        <div>No statistics available</div>
      )}
    </div>
  );
};

export default Statistics;

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { ThreeDots } from "react-loader-spinner"; 
import "./index.css";

const monthNames = {
  "01": "January", "02": "February", "03": "March", "04": "April",
  "05": "May", "06": "June", "07": "July", "08": "August",
  "09": "September", "10": "October", "11": "November", "12": "December"
};

const BarchartDisplay = ({ selectedMonth }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedMonth) return;

    const fetchPriceRangeStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`https://finalroxiler-backend-1.onrender.com/api/price-range-statistics?month=${selectedMonth}`);
        if (!response.ok) throw new Error("Failed to fetch price range statistics");
        const result = await response.json();

        // Define expected ranges up to "901 and above"
        const expectedRanges = [
          "0-100", "101-200", "201-300", "301-400", "401-500",
          "501-600", "601-700", "701-800", "801-900", "901 and above"
        ];

        // Convert API response into chart-friendly format while ensuring all ranges exist
        const formattedData = expectedRanges.map(range => ({
          range,
          count: result[range] || 0 // Default to 0 if range is missing from API response
        }));

        setData(formattedData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPriceRangeStats();
  }, [selectedMonth]);

  return (
    <div className="barchart-container">
      <h2 className="chart-title">
        Bar Chart Stats - {monthNames[selectedMonth] || "Unknown"}
      </h2>

      {loading ? (
        <div className="loader-container">
          <ThreeDots color="#007bff" height={50} width={50} />
          
        </div>
      ) : error ? (
        <div className="error-text">{error}</div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#48c9b0" radius={[5, 5, 0, 0]} barSize={50} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default BarchartDisplay;

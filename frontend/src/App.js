import { useState } from "react";
import AllTransactions from "./components/AllTransactions";
import Statistics from "./components/Statistics";
import BarchartDisplay from "./components/BarchartDisplay";

function App() {
  const [selectedMonth, setSelectedMonth] = useState("03"); 

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-center mb-6">Transaction Dashboard</h1>
      <AllTransactions selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
      <Statistics selectedMonth={selectedMonth} />
      <BarchartDisplay selectedMonth={selectedMonth} />
    </div>
  );
}

export default App;

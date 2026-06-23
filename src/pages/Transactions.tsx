import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ReceiptText, Search, Filter, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });
    return unsubscribe;
  }, []);

  const filteredTx = transactions.filter(tx => {
    const matchesSearch = (tx.customerName || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Aashirwad Stores - Transaction Report", 14, 15);
    
    const tableData = filteredTx.map(tx => [
      tx.date ? tx.date.toDate().toLocaleDateString('en-IN') : '',
      tx.customerName || 'Unknown',
      tx.type === 'paid' ? 'Paid' : 'Udhari',
      `Rs. ${tx.amount.toLocaleString('en-IN')}`,
      tx.description || '-'
    ]);

    autoTable(doc, {
      head: [['Date', 'Customer', 'Type', 'Amount', 'Details']],
      body: tableData,
      startY: 25,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [5, 150, 105] } // Emerald 600
    });

    doc.save("Aashirwad_Transactions.pdf");
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Transactions</h2>
          <p className="text-slate-500 text-sm">View and manage all payment and credit history.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 w-full sm:w-auto justify-center text-sm"
        >
          <Download className="w-4 h-4" /> Export PDF
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-3 flex-1">
          <Search className="w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search customer..." 
            className="flex-1 outline-none text-sm text-slate-900 placeholder:text-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            className="outline-none text-sm text-slate-700 bg-transparent cursor-pointer"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Entries</option>
            <option value="udhari">Udhari Only</option>
            <option value="paid">Payments Only</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="bg-slate-100 p-3 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">Customer</th>
                <th className="bg-slate-100 p-3 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">Date/Time</th>
                <th className="bg-slate-100 p-3 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">Amount</th>
                <th className="bg-slate-100 p-3 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">Status</th>
                <th className="bg-slate-100 p-3 px-5 text-xs uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredTx.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-5 text-center text-slate-500 text-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredTx.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 px-5 border-b border-slate-200 text-sm">
                      <strong className="font-semibold text-slate-900">{tx.customerName || "Unknown"}</strong>
                    </td>
                    <td className="p-3 px-5 border-b border-slate-200 text-sm text-slate-600">
                      {tx.date ? tx.date.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                      <span className="block text-xs text-slate-400">
                        {tx.date ? tx.date.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </td>
                    <td className={`p-3 px-5 border-b border-slate-200 text-sm font-semibold ${
                      tx.type === 'paid' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'paid' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 px-5 border-b border-slate-200">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        tx.type === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.type === 'paid' ? 'Paid' : 'Udhari'}
                      </span>
                    </td>
                    <td className="p-3 px-5 border-b border-slate-200 text-sm text-slate-500 max-w-[150px] truncate" title={tx.description}>
                      {tx.description || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

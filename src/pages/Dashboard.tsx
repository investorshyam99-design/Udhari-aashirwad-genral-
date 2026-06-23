import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { Link } from "react-router";
import { db } from "../lib/firebase";
import { Users, IndianRupee, TrendingUp, ReceiptText, ArrowUpRight, ArrowDownRight } from "lucide-react";

export function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPending: 0,
    totalReceived: 0,
    todayEntries: 0
  });

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qCustomers = query(collection(db, "customers"));
    const unsubscribeCustomers = onSnapshot(qCustomers, (snapshot) => {
      let pending = 0;
      let received = 0;
      snapshot.forEach(doc => {
        const data = doc.data();
        pending += (data.balance || 0);
        received += (data.total_paid || 0);
      });
      setStats(prev => ({ ...prev, totalCustomers: snapshot.size, totalPending: pending, totalReceived: received }));
    });

    const qTransactions = query(collection(db, "transactions"));
    const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
      const txs: any[] = [];
      let todayCount = 0;
      const today = new Date();
      today.setHours(0,0,0,0);

      snapshot.forEach(doc => {
        const data = doc.data();
        txs.push({ id: doc.id, ...data });
        
        const ts = data.timestamp || data.date;
        if (ts && ts.toDate() >= today) {
          todayCount++;
        }
      });
      
      txs.sort((a: any, b: any) => {
        const tsA = a.timestamp || a.date;
        const tsB = b.timestamp || b.date;
        if (!tsA) return 1;
        if (!tsB) return -1;
        return tsB.toMillis() - tsA.toMillis();
      });
      
      setStats(prev => ({ ...prev, todayEntries: todayCount }));
      setRecentTransactions(txs.slice(0, 5));
      setLoading(false);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeTransactions();
    };
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading dashboard...</div>;
  }

  const statCards = [
    { label: "Total Pending", value: `₹${stats.totalPending.toLocaleString('en-IN')}`, color: "text-red-600" },
    { label: "Received Today", value: `₹${stats.totalReceived.toLocaleString('en-IN')}`, color: "text-green-600" },
    { label: "Active Customers", value: stats.totalCustomers, color: "text-slate-900" },
    { label: "Today's Entries", value: stats.todayEntries, color: "text-slate-900" },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
        <p className="text-slate-500 text-sm">Store performance and pending balances.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col justify-center">
            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1 font-medium">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          <Link to="/transactions" className="text-xs font-semibold text-green-600 cursor-pointer hover:underline">View All</Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentTransactions.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">No recent transactions.</div>
          ) : (
            recentTransactions.map((tx) => {
              const ts = tx.timestamp || tx.date;
              return (
              <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex flex-col">
                  <p className="font-semibold text-slate-900 text-sm">{tx.customerName || "Unknown Customer"}</p>
                  <p className="text-xs text-slate-500">{ts ? ts.toDate().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    tx.type === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {tx.type === 'paid' ? 'Paid' : 'Udhari'}
                  </span>
                  <div className="text-right min-w-[80px]">
                    <p className={`font-semibold text-sm ${tx.type === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'paid' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            )})
          )}
        </div>
      </div>
    </div>
  );
}

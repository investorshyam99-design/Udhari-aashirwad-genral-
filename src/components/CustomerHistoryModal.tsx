import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { X, ArrowDownRight, ArrowUpRight } from "lucide-react";

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

export function CustomerHistoryModal({ isOpen, onClose, customerId, customerName }: CustomerHistoryModalProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !customerId) return;

    const q = query(
      collection(db, "transactions"),
      where("customerId", "==", customerId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => {
        const tsA = a.timestamp || a.date;
        const tsB = b.timestamp || b.date;
        if (!tsA) return 1;
        if (!tsB) return -1;
        return tsB.toMillis() - tsA.toMillis();
      });
      setTransactions(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [isOpen, customerId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center sm:p-4 z-50">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95 duration-200 h-[80vh] sm:h-[600px] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Transaction History</h3>
            <p className="text-xs text-slate-500">{customerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No transactions found for this customer.
            </div>
          ) : (
            transactions.map(t => (
              <div key={t.id} className={`p-3 rounded-xl border ${t.type === 'udhari' ? 'bg-red-50/50 border-red-100' : 'bg-green-50/50 border-green-100'} flex justify-between items-center`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full mt-0.5 ${t.type === 'udhari' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {t.type === 'udhari' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className={`font-semibold text-sm ${t.type === 'udhari' ? 'text-red-900' : 'text-green-900'}`}>
                      {t.type === 'udhari' ? 'Udhari Given' : 'Payment Received'}
                    </p>
                    {t.note && <p className="text-xs text-slate-600 mt-0.5">{t.note}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">
                      {(t.timestamp || t.date)?.toDate ? (t.timestamp || t.date).toDate().toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      }) : 'Pending...'}
                    </p>
                  </div>
                </div>
                <div className={`font-bold text-base ${t.type === 'udhari' ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{t.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

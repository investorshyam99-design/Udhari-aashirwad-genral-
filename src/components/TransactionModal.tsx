import { useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  type: "udhari" | "paid";
  onSuccess: () => void;
}

export function TransactionModal({ isOpen, onClose, customerId, customerName, type, onSuccess }: TransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDateTime(now.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;
    
    setLoading(true);
    try {
      const selectedDate = new Date(dateTime);
      
      // Create transaction
      await addDoc(collection(db, "transactions"), {
        customerId,
        customerName,
        type,
        amount: numAmount,
        note,
        timestamp: Timestamp.fromDate(selectedDate)
      });

      // Update customer balance
      const customerRef = doc(db, "customers", customerId);
      
      if (type === "udhari") {
        await updateDoc(customerRef, {
          total_udhari: increment(numAmount),
          balance: increment(numAmount)
        });
      } else {
        await updateDoc(customerRef, {
          total_paid: increment(numAmount),
          balance: increment(-numAmount)
        });
      }

      onSuccess();
      onClose();
      setAmount("");
      setNote("");
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  const isUdhari = type === "udhari";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`p-4 border-b border-slate-100 ${isUdhari ? 'bg-red-50' : 'bg-green-50'}`}>
          <h3 className={`text-lg font-bold ${isUdhari ? 'text-red-700' : 'text-green-700'}`}>
            {isUdhari ? "Add Udhari (Credit)" : "Add Paid Amount"}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹) *</label>
            <input 
              type="number" 
              required
              min="1"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 outline-none"
              value={amount} 
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Note / Details</label>
            <textarea 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 outline-none resize-none"
              rows={2}
              value={note} 
              onChange={e => setNote(e.target.value)}
              placeholder={isUdhari ? "e.g. Grocery items" : "e.g. Cash payment"}
            ></textarea>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Date & Time</label>
            <input 
              type="datetime-local" 
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 outline-none text-slate-700"
              value={dateTime} 
              onChange={e => setDateTime(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-70 ${
                isUdhari ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

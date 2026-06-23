import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Plus, Search, MoreVertical, Phone, MapPin, User as UserIcon } from "lucide-react";

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "", address: "" });

  useEffect(() => {
    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
    });
    return unsubscribe;
  }, []);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    try {
      await addDoc(collection(db, "customers"), {
        ...newCustomer,
        total_udhari: 0,
        total_paid: 0,
        balance: 0,
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewCustomer({ name: "", mobile: "", address: "" });
    } catch (error) {
      console.error("Error adding customer: ", error);
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (c.mobile || "").includes(search)
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Customers</h2>
          <p className="text-slate-500 text-sm">Manage your store's customer accounts.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search customer or mobile..." 
          className="flex-1 outline-none text-sm text-slate-900 placeholder:text-slate-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="bg-white rounded-2xl p-4 border border-slate-200 hover:shadow-sm transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{customer.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span>{customer.mobile || "No number"}</span>
                  </div>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            
            {customer.address && (
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-3 bg-slate-50 p-2 rounded-lg">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{customer.address}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-100">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Total Udhari</p>
                <p className="font-semibold text-sm text-red-600">₹{(customer.total_udhari || 0).toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-0.5">Balance Due</p>
                <p className="font-bold text-slate-900 text-base">₹{(customer.balance || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => {
                  if(!customer.mobile) {
                    alert("No mobile number provided for this customer.");
                    return;
                  }
                  const msg = `Namaste ${customer.name} ji, Aapka Rs.${customer.balance} udhar baki hai. Kripya payment kar dijiye. - Aashirwad Stores`;
                  if(confirm(`Send SMS to ${customer.mobile}?\n\nMessage: ${msg}`)) {
                    fetch("/api/sms", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ number: customer.mobile, message: msg })
                    })
                    .then(res => res.json())
                    .then(data => {
                      if(data.error) alert("Error: " + data.error);
                      else alert("SMS requested successfully!");
                    })
                    .catch(err => alert("Error: " + err.message));
                  }
                }}
                className="flex-1 w-full bg-transparent border border-green-600 text-green-600 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600 hover:text-white transition-all"
              >
                Reminder SMS
              </button>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            No customers found. Try a different search or add a new customer.
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
            </div>
            <form onSubmit={handleAddCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input 
                  type="text" required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 outline-none"
                  value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input 
                  type="tel" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 outline-none"
                  value={newCustomer.mobile} onChange={e => setNewCustomer({...newCustomer, mobile: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address (Optional)</label>
                <textarea 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                  rows={3}
                  value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})}
                ></textarea>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

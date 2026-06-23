import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Plus, Search, MoreVertical, Phone, MapPin, User as UserIcon } from "lucide-react";
import { TransactionModal } from "../components/TransactionModal";
import { CustomerHistoryModal } from "../components/CustomerHistoryModal";

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null);
  
  const [newCustomer, setNewCustomer] = useState({ name: "", mobile: "", address: "" });

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [transactionModal, setTransactionModal] = useState<{isOpen: boolean, type: "udhari" | "paid", customerId: string, customerName: string}>({ isOpen: false, type: "udhari", customerId: "", customerName: "" });
  const [historyModal, setHistoryModal] = useState<{isOpen: boolean, customerId: string, customerName: string}>({ isOpen: false, customerId: "", customerName: "" });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      if (editCustomerId) {
        await updateDoc(doc(db, "customers", editCustomerId), {
          ...newCustomer
        });
      } else {
        await addDoc(collection(db, "customers"), {
          ...newCustomer,
          total_udhari: 0,
          total_paid: 0,
          balance: 0,
          createdAt: serverTimestamp()
        });
      }
      setIsAddModalOpen(false);
      setEditCustomerId(null);
      setNewCustomer({ name: "", mobile: "", address: "" });
    } catch (error) {
      console.error("Error saving customer: ", error);
      alert("Failed to save customer");
    }
  };

  const handleDeleteCustomer = async (customerId: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, "customers", customerId));
        setActiveMenuId(null);
      } catch (error) {
        console.error("Error deleting customer: ", error);
        alert("Failed to delete customer");
      }
    }
  };

  const filteredCustomers = customers.filter(c => 
    (c.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (c.mobile || "").includes(search)
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Customers</h2>
          <p className="text-slate-500 text-sm">Manage your store's customer accounts.</p>
        </div>
        <button 
          onClick={() => {
            setEditCustomerId(null);
            setNewCustomer({ name: "", mobile: "", address: "" });
            setIsAddModalOpen(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm w-full sm:w-auto justify-center shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-3 shadow-sm">
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
          <div key={customer.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all relative">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
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
              
              <div className="relative">
                <button 
                  onClick={() => setActiveMenuId(activeMenuId === customer.id ? null : customer.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {activeMenuId === customer.id && (
                  <div ref={menuRef} className="absolute right-0 top-8 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20 animate-in fade-in zoom-in-95 duration-100">
                    <button 
                      onClick={() => { setTransactionModal({ isOpen: true, type: "udhari", customerId: customer.id, customerName: customer.name }); setActiveMenuId(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-red-500"></div> Add Udhari
                    </button>
                    <button 
                      onClick={() => { setTransactionModal({ isOpen: true, type: "paid", customerId: customer.id, customerName: customer.name }); setActiveMenuId(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500"></div> Add Paid Amount
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button 
                      onClick={() => { setHistoryModal({ isOpen: true, customerId: customer.id, customerName: customer.name }); setActiveMenuId(null); }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View History
                    </button>
                    <button 
                      onClick={() => {
                        if(!customer.mobile) {
                          alert("No mobile number provided for this customer.");
                          return;
                        }
                        const msg = `Namaste ${customer.name} ji, Aapka Rs.${customer.balance} udhar baki hai. Kripya payment kar dijiye. - Aashirwad Stores`;
                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                        const sep = isIOS ? '&' : '?';
                        window.location.href = `sms:${customer.mobile}${sep}body=${encodeURIComponent(msg)}`;
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Send SMS
                    </button>
                    <button 
                      onClick={() => { 
                        setNewCustomer({ name: customer.name, mobile: customer.mobile, address: customer.address || "" });
                        setEditCustomerId(customer.id);
                        setIsAddModalOpen(true);
                        setActiveMenuId(null); 
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Edit Customer
                    </button>
                    <button 
                      onClick={() => { handleDeleteCustomer(customer.id, customer.name); }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete Customer
                    </button>
                  </div>
                )}
              </div>
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
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button 
                onClick={() => { setTransactionModal({ isOpen: true, type: "udhari", customerId: customer.id, customerName: customer.name }); }}
                className="w-full bg-red-50 text-red-700 hover:bg-red-100 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                + Udhari
              </button>
              <button 
                onClick={() => { setTransactionModal({ isOpen: true, type: "paid", customerId: customer.id, customerName: customer.name }); }}
                className="w-full bg-green-50 text-green-700 hover:bg-green-100 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              >
                + Paid
              </button>
              <button 
                onClick={() => {
                  if(!customer.mobile) {
                    alert("No mobile number provided for this customer.");
                    return;
                  }
                  const msg = `Namaste ${customer.name} ji, Aapka Rs.${customer.balance} udhar baki hai. Kripya payment kar dijiye. - Aashirwad Stores`;
                  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                  const sep = isIOS ? '&' : '?';
                  window.location.href = `sms:${customer.mobile}${sep}body=${encodeURIComponent(msg)}`;
                }}
                className="col-span-2 w-full bg-transparent border border-green-600 text-green-600 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-600 hover:text-white transition-all flex justify-center items-center gap-1"
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
              <h3 className="text-base font-bold text-slate-900">{editCustomerId ? "Edit Customer" : "Add New Customer"}</h3>
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
                <button type="button" onClick={() => {setIsAddModalOpen(false); setEditCustomerId(null);}} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  {editCustomerId ? "Save Changes" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <TransactionModal 
        isOpen={transactionModal.isOpen}
        type={transactionModal.type}
        customerId={transactionModal.customerId}
        customerName={transactionModal.customerName}
        onClose={() => setTransactionModal({ ...transactionModal, isOpen: false })}
        onSuccess={() => {}}
      />

      <CustomerHistoryModal
        isOpen={historyModal.isOpen}
        customerId={historyModal.customerId}
        customerName={historyModal.customerName}
        onClose={() => setHistoryModal({ ...historyModal, isOpen: false })}
      />
    </div>
  );
}

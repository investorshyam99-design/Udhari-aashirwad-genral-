import { useState, useRef, useEffect } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Send, Bot, User as UserIcon, Mic, Loader2 } from "lucide-react";

export function Chatbot() {
  const [messages, setMessages] = useState<{role: 'user'|'assistant', text: string}[]>([
    { role: 'assistant', text: 'Namaste! I am your AI Udhari Assistant. Type messages like "Rahul 500 udhar" or "Aman ne 200 pay kiya".' }
  ]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const processTransaction = async (parsedData: any) => {
    const { customerName, amount, type, description } = parsedData;
    
    // 1. Find or create customer
    const q = query(collection(db, "customers"), where("name", "==", customerName));
    const querySnapshot = await getDocs(q);
    
    let customerId = "";
    let currentBalance = 0;
    let totalUdhari = 0;
    let totalPaid = 0;

    if (querySnapshot.empty) {
      // Create new customer
      if (type === 'udhari') {
        currentBalance = amount;
        totalUdhari = amount;
      } else {
        currentBalance = -amount;
        totalPaid = amount;
      }
      const newCustRef = await addDoc(collection(db, "customers"), {
        name: customerName,
        mobile: "",
        address: "",
        balance: currentBalance,
        total_udhari: totalUdhari,
        total_paid: totalPaid,
        createdAt: serverTimestamp()
      });
      customerId = newCustRef.id;
    } else {
      // Update existing
      const customerDoc = querySnapshot.docs[0];
      customerId = customerDoc.id;
      const data = customerDoc.data();
      totalUdhari = data.total_udhari || 0;
      totalPaid = data.total_paid || 0;
      currentBalance = data.balance || 0;

      if (type === 'udhari') {
        totalUdhari += amount;
        currentBalance += amount;
      } else {
        totalPaid += amount;
        currentBalance -= amount;
      }

      await updateDoc(doc(db, "customers", customerId), {
        total_udhari: totalUdhari,
        total_paid: totalPaid,
        balance: currentBalance
      });
    }

    // 2. Add transaction
    await addDoc(collection(db, "transactions"), {
      customerId,
      customerName,
      type,
      amount,
      description: description || "AI Entry",
      date: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { customerName, amount, type, currentBalance };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsProcessing(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const parsed = data.result;
      
      if (parsed && parsed.customerName && parsed.amount) {
        const result = await processTransaction(parsed);
        const actionText = result.type === 'paid' ? 'received from' : 'given as udhari to';
        
        const reply = `✅ Done! ₹${result.amount} ${actionText} ${result.customerName}.\nRemaining Balance: ₹${result.currentBalance}`;
        setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't understand the details. Please try again. Example: 'Rahul 500 udhar'" }]);
      }

    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `❌ Error: ${err.message || 'Something went wrong'}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto h-[calc(100vh-80px)] md:h-[calc(100vh-16px)] my-0 md:my-2 flex flex-col gap-3">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">AI Assistant</h2>
        <p className="text-slate-500 text-sm">Quickly record entries using natural language.</p>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden relative">
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-200">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-3.5 py-2.5 max-w-[85%] text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-green-100 text-slate-900 rounded-xl rounded-br-sm' 
                  : 'bg-white text-slate-800 rounded-xl rounded-bl-sm'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base leading-none">🤖</span>
                    <span className="font-semibold text-[10px] text-slate-500 uppercase tracking-wider">Assistant</span>
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="px-3.5 py-2.5 max-w-[85%] bg-white text-slate-500 rounded-xl rounded-bl-sm text-sm shadow-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="flex gap-2 items-center">
            <button type="button" className="p-2 text-slate-400 hover:text-green-600 rounded-full transition-colors shrink-0">
              <Mic className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all text-slate-800"
              placeholder="Type here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
            />
            <button 
              type="submit" 
              disabled={isProcessing || !input.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white w-9 h-9 rounded-full flex items-center justify-center transition-colors shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

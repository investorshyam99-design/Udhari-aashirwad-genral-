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
    const { customerName, amount, intent, description } = parsedData;
    
    // 1. Find customer (fuzzy match)
    const q = query(collection(db, "customers"));
    const querySnapshot = await getDocs(q);
    
    const matches: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name.toLowerCase().includes(customerName.toLowerCase())) {
        matches.push({ id: doc.id, ...data });
      }
    });

    if (matches.length > 1) {
      const options = matches.map(m => `${m.name} (${m.mobile || 'No number'})`).join("\n- ");
      return { reply: `I found multiple customers for "${customerName}". Please specify which one:\n- ${options}` };
    }

    let targetCustomer = matches.length === 1 ? matches[0] : null;
    let customerId = targetCustomer ? targetCustomer.id : "";

    if (intent === "query_balance") {
      if (!targetCustomer) return { reply: `Customer "${customerName}" not found.` };
      return { reply: `${targetCustomer.name} has a remaining balance of ₹${targetCustomer.balance}.` };
    }

    if (intent === "send_reminder") {
      if (!targetCustomer) return { reply: `Customer "${customerName}" not found.` };
      if (!targetCustomer.mobile) return { reply: `${targetCustomer.name} does not have a mobile number saved.` };
      
      const msg = `Namaste ${targetCustomer.name} ji, Aapka Rs.${targetCustomer.balance} udhar baki hai. Kripya payment kar dijiye. - Aashirwad Stores`;
      try {
        const res = await fetch("/api/sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ number: targetCustomer.mobile, message: msg })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return { reply: `✅ SMS reminder sent to ${targetCustomer.name} (${targetCustomer.mobile}).` };
      } catch (e: any) {
        return { reply: `❌ Failed to send SMS: ${e.message}` };
      }
    }
    
    let currentBalance = targetCustomer ? targetCustomer.balance : 0;
    let totalUdhari = targetCustomer ? targetCustomer.total_udhari : 0;
    let totalPaid = targetCustomer ? targetCustomer.total_paid : 0;
    const actualName = targetCustomer ? targetCustomer.name : customerName;

    if (!targetCustomer) {
      // Create new customer
      if (intent === 'udhari') {
        currentBalance = amount;
        totalUdhari = amount;
      } else if (intent === 'paid') {
        currentBalance = -amount;
        totalPaid = amount;
      }
      const newCustRef = await addDoc(collection(db, "customers"), {
        name: actualName,
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
      if (intent === 'udhari') {
        totalUdhari += amount;
        currentBalance += amount;
      } else if (intent === 'paid') {
        totalPaid += amount;
        currentBalance -= amount;
      }

      await updateDoc(doc(db, "customers", customerId), {
        total_udhari: totalUdhari,
        total_paid: totalPaid,
        balance: currentBalance
      });
    }

    // Add transaction
    await addDoc(collection(db, "transactions"), {
      customerId,
      customerName: actualName,
      type: intent,
      amount,
      description: description || "AI Entry",
      timestamp: serverTimestamp()
    });

    const actionText = intent === 'paid' ? 'received from' : 'given as udhari to';
    return { reply: `✅ Done! ₹${amount} ${actionText} ${actualName}.\nRemaining Balance: ₹${currentBalance}` };
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
      
      if (parsed && parsed.customerName && parsed.intent) {
        const result = await processTransaction(parsed);
        setMessages(prev => [...prev, { role: 'assistant', text: result.reply }]);
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

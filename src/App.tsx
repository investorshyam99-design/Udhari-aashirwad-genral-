/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Customers } from "./pages/Customers";
import { Transactions } from "./pages/Transactions";
import { Chatbot } from "./pages/Chatbot";
import { Login } from "./pages/Login";
import { useEffect, useState } from "react";
import { auth } from "./lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-emerald-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/"
          element={user ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="chatbot" element={<Chatbot />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

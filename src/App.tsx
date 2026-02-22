import { HashRouter, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ResetPassword from "./pages/ResetPassword";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/reset" element={<ResetPassword />} />
        <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      </Routes>
    </HashRouter>
  );
}

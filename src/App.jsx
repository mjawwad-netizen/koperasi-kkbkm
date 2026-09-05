import { useState, useEffect } from "react";
import { DataProvider, useData } from "./context/DataContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MemberView from "./pages/MemberView";
import Anggota from "./pages/Anggota";
import Simpanan from "./pages/Simpanan";
import Kasir from "./pages/Kasir";
import Laporan from "./pages/Laporan";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import S from "./styles";

function AppInner() {
  const { user, loaded } = useData();
  const [tab, setTab] = useState("anggota");
  const [showRegister, setShowRegister] = useState(false);

  const isAdmin = user?.role === "admin";
  const isPengelola = user?.role === "pengelola";
  const isAnggota = user?.role === "anggota";

  useEffect(() => { if (isPengelola) setTab("kasir"); }, [user]);

  if (!loaded) return <div style={{ ...S.app, alignItems: "center", justifyContent: "center" }}><p style={{ color: "#64748B" }}>Memuat data...</p></div>;

  if (!user) {
    if (showRegister) return <Register onBack={() => setShowRegister(false)} />;
    return <Login onRegister={() => setShowRegister(true)} />;
  }

  if (isAnggota) return <MemberView />;

  const navItems = [
    ...(isAdmin ? [{ key: "anggota", icon: "👥", label: "Anggota" }, { key: "simpanan", icon: "💰", label: "Simpanan" }] : []),
    { key: "kasir", icon: "🛒", label: "Kasir" },
    ...(isAdmin ? [{ key: "laporan", icon: "📊", label: "Laporan" }] : []),
  ];

  return (
    <div style={S.app}>
      <Header />
      <div style={S.content}>
        {tab === "anggota" && isAdmin && <Anggota />}
        {tab === "simpanan" && isAdmin && <Simpanan />}
        {tab === "kasir" && <Kasir />}
        {tab === "laporan" && isAdmin && <Laporan />}
      </div>
      <BottomNav items={navItems} activeTab={tab} onChangeTab={setTab} cartCount={0} />
    </div>
  );
}

export default function App() {
  return <DataProvider><AppInner /></DataProvider>;
}

import { useData } from "../context/DataContext";
import S from "../styles";

export default function Header() {
  const { logout, lowStock } = useData();
  return (
    <div style={S.header}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <img src="/logo.png" alt="BAZARA" style={{ height: 28 }} />
        <div style={S.headerTitle}>BAZARA</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {lowStock.length > 0 && <span style={{ background: "#FEF3C7", color: "#92400E", fontSize: 10, padding: "3px 8px", borderRadius: 10, fontWeight: 600 }}>⚠ {lowStock.length}</span>}
        <button onClick={logout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Keluar</button>
      </div>
    </div>
  );
}

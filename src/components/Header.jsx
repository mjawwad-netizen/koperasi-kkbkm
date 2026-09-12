import { useData } from "../context/DataContext";
import S from "../styles";

export default function Header() {
  const { logout, lowStock } = useData();
  return (
    <div style={S.header}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/logo.png" alt="BAZARA" style={{ height: 32, borderRadius: 8 }} />
        <div>
          <div style={S.headerTitle}>BAZARA</div>
          <div style={{ fontSize: 10, opacity: 0.8, letterSpacing: 0.5 }}>Koperasi Konsumen</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {lowStock.length > 0 && <span style={{ background: "rgba(251,191,36,0.2)", color: "#FCD34D", fontSize: 10, padding: "4px 10px", borderRadius: 20, fontWeight: 700 }}><i className="ti ti-alert-triangle" style={{ marginRight: 3 }}></i>{lowStock.length}</span>}
        <button onClick={logout} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 10, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600, backdropFilter: "blur(4px)" }}>
          <i className="ti ti-logout" style={{ marginRight: 4, fontSize: 14 }}></i>Keluar
        </button>
      </div>
    </div>
  );
}

import S from "../styles";

const ICONS = {
  anggota: "ti-users",
  simpanan: "ti-wallet",
  kasir: "ti-shopping-cart",
  laporan: "ti-chart-bar",
};

export default function BottomNav({ items, activeTab, onChangeTab, cartCount }) {
  return (
    <div style={{ ...S.bottomNav, gridTemplateColumns: "repeat(" + items.length + ", 1fr)" }}>
      {items.map(n => (
        <button key={n.key} style={S.navItem(activeTab === n.key)} onClick={() => onChangeTab(n.key)}>
          <div style={{ position: "relative" }}>
            <i className={"ti " + (ICONS[n.key] || "ti-circle")} style={{ fontSize: 22, transition: "all 0.2s" }}></i>
            {n.key === "kasir" && cartCount > 0 && <span style={{ position: "absolute", top: -5, right: -10, background: "#EF4444", color: "white", fontSize: 9, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{cartCount}</span>}
          </div>
          {n.label}
          {activeTab === n.key && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#2563EB", marginTop: 1 }}></div>}
        </button>
      ))}
    </div>
  );
}

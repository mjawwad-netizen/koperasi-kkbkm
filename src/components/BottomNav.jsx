import S from "../styles";

export default function BottomNav({ items, activeTab, onChangeTab, cartCount }) {
  return (
    <div style={{ ...S.bottomNav, gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map(n => (
        <button key={n.key} style={S.navItem(activeTab === n.key)} onClick={() => onChangeTab(n.key)}>
          <span style={{ fontSize: 20 }}>{n.icon}</span>{n.label}
          {n.key === "kasir" && cartCount > 0 && <span style={{ background: "#DC2626", color: "white", fontSize: 9, padding: "1px 5px", borderRadius: 8 }}>{cartCount}</span>}
        </button>
      ))}
    </div>
  );
}

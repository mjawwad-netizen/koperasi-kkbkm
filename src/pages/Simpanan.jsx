import { useState } from "react";
import { useData } from "../context/DataContext";
import { BULAN, SIMPANAN_POKOK, SIMPANAN_WAJIB, TAHUN_AKTIF, fmt } from "../config";
import S from "../styles";

export default function Simpanan() {
  const { activeMembers, simpananPokok, simpananWajib, currentMonth, bayarPokok, toggleWajib } = useData();
  const [sub, setSub] = useState("wajib");

  return (<>
    <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}><button style={S.tabBtn(sub === "wajib")} onClick={() => setSub("wajib")}>Wajib</button><button style={S.tabBtn(sub === "pokok")} onClick={() => setSub("pokok")}>Pokok</button></div>

    {sub === "wajib" && (<>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Sudah</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>{activeMembers.filter(m => (simpananWajib[m.id]||[]).includes(currentMonth)).length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Belum</div><div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{activeMembers.filter(m => !(simpananWajib[m.id]||[]).includes(currentMonth)).length}</div></div></div>
      <div style={S.sectionTitle}>Rp {fmt(SIMPANAN_WAJIB)}/bln — {TAHUN_AKTIF}</div>
      {activeMembers.map(m => { const w = simpananWajib[m.id]||[]; return (<div key={m.id} style={S.card}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</span><span style={{ fontSize: 12, color: "#2563EB", fontWeight: 500 }}>Rp {fmt(w.length*SIMPANAN_WAJIB)}</span></div><div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{BULAN.map((b,i) => (<div key={i} style={S.monthDot(w.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")} onClick={() => i<=currentMonth && toggleWajib(m.id,i)}>{b.substring(0,1)}</div>))}</div></div>); })}
    </>)}

    {sub === "pokok" && (<>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Lunas</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>{Object.values(simpananPokok).filter(s => s.lunas).length}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Belum</div><div style={{ fontSize: 20, fontWeight: 700, color: "#DC2626" }}>{activeMembers.length - Object.values(simpananPokok).filter(s => s.lunas).length}</div></div></div>
      {activeMembers.map(m => { const s = simpananPokok[m.id]; return (<div key={m.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</div><div style={{ fontSize: 11, color: "#64748B" }}>{m.id}</div></div>{s?.lunas ? <span style={S.badge("aktif")}>Lunas</span> : <button style={S.btnOutline} onClick={() => bayarPokok(m.id)}>Bayar</button>}</div>); })}
    </>)}
  </>);
}

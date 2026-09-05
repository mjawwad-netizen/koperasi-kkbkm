import { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { BULAN, SIMPANAN_POKOK, SIMPANAN_WAJIB, TAHUN_AKTIF, KATEGORI_PENGELUARAN, fmt } from "../config";
import S from "../styles";

export default function Laporan() {
  const { members, activeMembers, simpananPokok, simpananWajib, arusKas, transaksi, pembayaran, shuConfig, currentMonth, lowStock, labaKotor, hitungSHU, updatePembayaranStatus, addPengeluaran, updateShuConfig } = useData();
  const [sub, setSub] = useState("dashboard");
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth());
  const [showPengeluaran, setShowPengeluaran] = useState(false);
  const [showBuktiImg, setShowBuktiImg] = useState(null);

  const stats = useMemo(() => {
    const bulanIni = arusKas.filter(a => { const d = new Date(a.tgl); return d.getMonth() === filterBulan && d.getFullYear() === TAHUN_AKTIF; });
    const totalMasuk = bulanIni.filter(a => a.tipe === "masuk").reduce((s, a) => s + a.jumlah, 0);
    const totalKeluar = bulanIni.filter(a => a.tipe === "keluar").reduce((s, a) => s + a.jumlah, 0);
    const allMasuk = arusKas.filter(a => a.tipe === "masuk").reduce((s, a) => s + a.jumlah, 0);
    const allKeluar = arusKas.filter(a => a.tipe === "keluar").reduce((s, a) => s + a.jumlah, 0);
    return { bulanIni, totalMasuk, totalKeluar, saldoKas: allMasuk - allKeluar };
  }, [arusKas, filterBulan]);

  const pending = pembayaran.filter(p => p.status === "menunggu");

  return (<>
    <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}><button style={S.tabBtn(sub === "dashboard")} onClick={() => setSub("dashboard")}>Dashboard</button><button style={S.tabBtn(sub === "aruskas")} onClick={() => setSub("aruskas")}>Arus kas</button><button style={S.tabBtn(sub === "shu")} onClick={() => setSub("shu")}>SHU</button></div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ fontSize: 12, color: "#64748B" }}>Bulan:</span><select style={{ ...S.input, width: "auto", padding: "6px 10px", fontSize: 13 }} value={filterBulan} onChange={e => setFilterBulan(parseInt(e.target.value))}>{BULAN.map((b,i) => <option key={i} value={i}>{b} {TAHUN_AKTIF}</option>)}</select></div>

    {sub === "dashboard" && (<>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Anggota aktif</div><div style={{ fontSize: 22, fontWeight: 700, color: "#2563EB" }}>{activeMembers.length}</div></div>
        <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Saldo kas</div><div style={{ fontSize: 22, fontWeight: 700, color: stats.saldoKas >= 0 ? "#16A34A" : "#DC2626" }}>Rp {fmt(stats.saldoKas)}</div></div>
      </div>
      <div style={S.sectionTitle}>Keuangan — {BULAN[filterBulan]}</div>
      <div style={{ ...S.card, background: "#F0FDF4", border: "1px solid #BBF7D0" }}><div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}><span style={{ color: "#166534" }}>Pemasukan</span><span style={{ fontWeight: 700, color: "#166534" }}>Rp {fmt(stats.totalMasuk)}</span></div><div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}><span style={{ color: "#991B1B" }}>Pengeluaran</span><span style={{ fontWeight: 700, color: "#991B1B" }}>Rp {fmt(stats.totalKeluar)}</span></div><div style={{ borderTop: "1px solid #BBF7D0", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 15 }}><span style={{ fontWeight: 600 }}>Selisih</span><span style={{ fontWeight: 700, color: stats.totalMasuk-stats.totalKeluar >= 0 ? "#166534" : "#991B1B" }}>Rp {fmt(stats.totalMasuk-stats.totalKeluar)}</span></div></div>

      {pending.length > 0 && (<><div style={S.sectionTitle}>🔔 Verifikasi pembayaran ({pending.length})</div>{pending.map(p => { const a = members.find(m => m.id === p.anggotaId); return (<div key={p.id} style={{ ...S.card, borderLeft: "3px solid #F59E0B" }}><div style={{ fontSize: 13, fontWeight: 600 }}>{a?.nama || p.anggotaId}</div><div style={{ fontSize: 12, color: "#64748B" }}>{p.jenis} · Rp {fmt(p.jumlah)}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{p.tgl} · {p.bukti && `Ref: ${p.bukti}`}</div>{p.buktiImg && <img src={p.buktiImg} alt="Bukti" onClick={() => setShowBuktiImg(p.buktiImg)} style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 6, marginTop: 6, cursor: "pointer", border: "1px solid #E8E4DC" }} />}<div style={{ display: "flex", gap: 6, marginTop: 8 }}><button style={S.btnSm("#16A34A")} onClick={() => updatePembayaranStatus(p.id, "diterima")}>✓ Terima</button><button style={S.btnSm("#DC2626")} onClick={() => updatePembayaranStatus(p.id, "ditolak")}>✕ Tolak</button></div></div>); })}</>)}

      {lowStock.length > 0 && (<><div style={S.sectionTitle}>⚠ Perlu restok</div>{lowStock.map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #F59E0B" }}><span style={{ fontSize: 13 }}>{b.nama}</span><span style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>{b.stok}</span></div>))}</>)}
    </>)}

    {sub === "aruskas" && (<>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Masuk</div><div style={{ fontSize: 18, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(stats.totalMasuk)}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Keluar</div><div style={{ fontSize: 18, fontWeight: 700, color: "#DC2626" }}>Rp {fmt(stats.totalKeluar)}</div></div></div>
      <button style={{ ...S.btn("#DC2626"), marginBottom: 12 }} onClick={() => setShowPengeluaran(true)}>+ Catat pengeluaran</button>
      <div style={S.sectionTitle}>Riwayat — {BULAN[filterBulan]}</div>
      {stats.bulanIni.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Belum ada</div> : stats.bulanIni.map(a => (<div key={a.id} style={{ ...S.card, borderLeft: `3px solid ${a.tipe === "masuk" ? "#16A34A" : "#DC2626"}` }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{a.kategori}</div><div style={{ fontSize: 12, color: "#64748B" }}>{a.keterangan}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{a.tgl}</div></div><span style={{ fontSize: 14, fontWeight: 700, color: a.tipe === "masuk" ? "#16A34A" : "#DC2626" }}>{a.tipe === "masuk" ? "+" : "−"}Rp {fmt(a.jumlah)}</span></div></div>))}
    </>)}

    {sub === "shu" && (<>
      <div style={S.sectionTitle}>Pengaturan alokasi SHU</div>
      <div style={S.card}><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[["Berdasarkan transaksi", "pctTransaksi"], ["Berdasarkan simpanan", "pctSimpanan"], ["Cadangan koperasi", "pctCadangan"]].map(([label, key]) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}><span>{label}</span><div style={{ display: "flex", alignItems: "center", gap: 4 }}><input type="number" style={{ ...S.input, width: 60, padding: "4px 8px", textAlign: "center" }} value={shuConfig[key]} onChange={e => updateShuConfig({ ...shuConfig, [key]: parseInt(e.target.value)||0 })} /><span>%</span></div></div>
        ))}
        <div style={{ fontSize: 12, color: (shuConfig.pctTransaksi+shuConfig.pctSimpanan+shuConfig.pctCadangan) === 100 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>Total: {shuConfig.pctTransaksi+shuConfig.pctSimpanan+shuConfig.pctCadangan}%{(shuConfig.pctTransaksi+shuConfig.pctSimpanan+shuConfig.pctCadangan) !== 100 ? " (harus 100%)" : ""}</div>
      </div></div>

      <div style={S.sectionTitle}>Ringkasan SHU</div>
      <div style={{ ...S.card, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}><span>Laba kotor toko</span><span style={{ fontWeight: 700 }}>Rp {fmt(labaKotor)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#64748B" }}><span>Transaksi ({shuConfig.pctTransaksi}%)</span><span>Rp {fmt(Math.round(labaKotor * shuConfig.pctTransaksi/100))}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#64748B" }}><span>Simpanan ({shuConfig.pctSimpanan}%)</span><span>Rp {fmt(Math.round(labaKotor * shuConfig.pctSimpanan/100))}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#64748B" }}><span>Cadangan ({shuConfig.pctCadangan}%)</span><span>Rp {fmt(Math.round(labaKotor * shuConfig.pctCadangan/100))}</span></div>
      </div>

      <div style={S.sectionTitle}>SHU per anggota</div>
      {activeMembers.map(m => { const shu = hitungSHU(m.id); return (<div key={m.id} style={S.card}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</div><div style={{ fontSize: 11, color: "#64748B" }}>Poin: {m.poin||0} · Simpanan: Rp {fmt(((simpananWajib[m.id]||[]).length * SIMPANAN_WAJIB) + (simpananPokok[m.id]?.lunas ? SIMPANAN_POKOK : 0))}</div></div><div style={{ fontSize: 16, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(shu)}</div></div></div>); })}
    </>)}

    {/* MODALS */}
    {showPengeluaran && (() => { const F = () => { const [f, setF] = useState({ kategori: KATEGORI_PENGELUARAN[0], keterangan: "", jumlah: "" }); const [err, setErr] = useState(""); return (<div style={S.modal} onClick={() => setShowPengeluaran(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Catat pengeluaran</span><button onClick={() => setShowPengeluaran(false)} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><select style={S.input} value={f.kategori} onChange={e => setF({...f, kategori: e.target.value})}>{KATEGORI_PENGELUARAN.map(k => <option key={k}>{k}</option>)}</select><input style={S.input} placeholder="Keterangan" value={f.keterangan} onChange={e => { setF({...f, keterangan: e.target.value}); setErr(""); }} /><input style={S.input} placeholder="Jumlah (Rp)" type="number" value={f.jumlah} onChange={e => setF({...f, jumlah: e.target.value})} />{err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}<button style={S.btn("#DC2626")} onClick={() => { if (!f.keterangan.trim()) { setErr("Keterangan wajib"); return; } if (!f.jumlah || parseInt(f.jumlah)<=0) { setErr("Jumlah > 0"); return; } addPengeluaran(f); setShowPengeluaran(false); }}>Simpan</button></div></div></div>); }; return <F />; })()}
    {showBuktiImg && <div style={{ ...S.modal, alignItems: "center" }} onClick={() => setShowBuktiImg(null)}><img src={showBuktiImg} alt="Bukti" style={{ maxWidth: "90%", maxHeight: "80vh", borderRadius: 12 }} /></div>}
  </>);
}

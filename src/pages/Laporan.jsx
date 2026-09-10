import { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { BULAN, SIMPANAN_POKOK, SIMPANAN_WAJIB, TAHUN_AKTIF, KATEGORI_PENGELUARAN, fmt } from "../config";
import S from "../styles";

const TIPE_NOTIF = [
  { value: "promo", label: "Promo harga" },
  { value: "produk_baru", label: "Produk baru" },
  { value: "pengumuman", label: "Pengumuman" },
  { value: "info", label: "Info umum" },
];

export default function Laporan() {
  const { members, activeMembers, simpananPokok, simpananWajib, arusKas, transaksi, pembayaran, shuConfig, notifikasi, currentMonth, lowStock, labaKotor, hitungSHU, updatePembayaranStatus, addPengeluaran, updateShuConfig, addNotifikasi, hapusNotifikasi } = useData();
  const [sub, setSub] = useState("dashboard");
  const [filterBulan, setFilterBulan] = useState(new Date().getMonth());
  const [showPengeluaran, setShowPengeluaran] = useState(false);
  const [showBuktiImg, setShowBuktiImg] = useState(null);
  const [showNotifForm, setShowNotifForm] = useState(false);

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
    <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}>
      <button style={S.tabBtn(sub === "dashboard")} onClick={() => setSub("dashboard")}>Dashboard</button>
      <button style={S.tabBtn(sub === "aruskas")} onClick={() => setSub("aruskas")}>Arus kas</button>
      <button style={S.tabBtn(sub === "shu")} onClick={() => setSub("shu")}>SHU</button>
      <button style={S.tabBtn(sub === "notif")} onClick={() => setSub("notif")}>Notif</button>
    </div>

    {sub !== "notif" && (
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "#64748B" }}>Bulan:</span>
        <select style={{ ...S.input, width: "auto", padding: "6px 10px", fontSize: 13 }} value={filterBulan} onChange={e => setFilterBulan(parseInt(e.target.value))}>
          {BULAN.map((b, i) => <option key={i} value={i}>{b} {TAHUN_AKTIF}</option>)}
        </select>
      </div>
    )}

    {sub === "dashboard" && (<>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Anggota aktif</div><div style={{ fontSize: 22, fontWeight: 700, color: "#2563EB" }}>{activeMembers.length}</div></div>
        <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Saldo kas</div><div style={{ fontSize: 22, fontWeight: 700, color: stats.saldoKas >= 0 ? "#16A34A" : "#DC2626" }}>Rp {fmt(stats.saldoKas)}</div></div>
      </div>
      <div style={S.sectionTitle}>Keuangan - {BULAN[filterBulan]}</div>
      <div style={{ ...S.card, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}><span style={{ color: "#166534" }}>Pemasukan</span><span style={{ fontWeight: 700, color: "#166534" }}>Rp {fmt(stats.totalMasuk)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}><span style={{ color: "#991B1B" }}>Pengeluaran</span><span style={{ fontWeight: 700, color: "#991B1B" }}>Rp {fmt(stats.totalKeluar)}</span></div>
        <div style={{ borderTop: "1px solid #BBF7D0", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 15 }}><span style={{ fontWeight: 600 }}>Selisih</span><span style={{ fontWeight: 700, color: stats.totalMasuk - stats.totalKeluar >= 0 ? "#166534" : "#991B1B" }}>Rp {fmt(stats.totalMasuk - stats.totalKeluar)}</span></div>
      </div>
      {pending.length > 0 && (<><div style={S.sectionTitle}>Verifikasi pembayaran ({pending.length})</div>{pending.map(p => { const a = members.find(m => m.id === p.anggotaId); return (<div key={p.id} style={{ ...S.card, borderLeft: "3px solid #F59E0B" }}><div style={{ fontSize: 13, fontWeight: 600 }}>{a?.nama || p.anggotaId}</div><div style={{ fontSize: 12, color: "#64748B" }}>{p.jenis} - Rp {fmt(p.jumlah)}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{p.tgl} {p.bukti && "- Ref: " + p.bukti}</div>{p.buktiImg && <img src={p.buktiImg} alt="Bukti" onClick={() => setShowBuktiImg(p.buktiImg)} style={{ width: "100%", maxHeight: 120, objectFit: "contain", borderRadius: 6, marginTop: 6, cursor: "pointer", border: "1px solid #E8E4DC" }} />}<div style={{ display: "flex", gap: 6, marginTop: 8 }}><button style={S.btnSm("#16A34A")} onClick={() => updatePembayaranStatus(p.id, "diterima")}>Terima</button><button style={S.btnSm("#DC2626")} onClick={() => updatePembayaranStatus(p.id, "ditolak")}>Tolak</button></div></div>); })}</>)}
      {lowStock.length > 0 && (<><div style={S.sectionTitle}>Perlu restok</div>{lowStock.map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #F59E0B" }}><span style={{ fontSize: 13 }}>{b.nama}</span><span style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>{b.stok}</span></div>))}</>)}
    </>)}

    {sub === "aruskas" && (<>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Masuk</div><div style={{ fontSize: 18, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(stats.totalMasuk)}</div></div><div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Keluar</div><div style={{ fontSize: 18, fontWeight: 700, color: "#DC2626" }}>Rp {fmt(stats.totalKeluar)}</div></div></div>
      <button style={{ ...S.btn("#DC2626"), marginBottom: 12 }} onClick={() => setShowPengeluaran(true)}>+ Catat pengeluaran</button>
      <div style={S.sectionTitle}>Riwayat - {BULAN[filterBulan]}</div>
      {stats.bulanIni.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Belum ada</div> : stats.bulanIni.map(a => (<div key={a.id} style={{ ...S.card, borderLeft: "3px solid " + (a.tipe === "masuk" ? "#16A34A" : "#DC2626") }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{a.kategori}</div><div style={{ fontSize: 12, color: "#64748B" }}>{a.keterangan}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{a.tgl}</div></div><span style={{ fontSize: 14, fontWeight: 700, color: a.tipe === "masuk" ? "#16A34A" : "#DC2626" }}>{a.tipe === "masuk" ? "+" : "-"}Rp {fmt(a.jumlah)}</span></div></div>))}
    </>)}

    {sub === "shu" && (<>
      <div style={S.sectionTitle}>Alokasi SHU</div>
      <div style={S.card}><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[["Transaksi (poin)", "pctTransaksi"], ["Simpanan", "pctSimpanan"], ["Cadangan", "pctCadangan"]].map(([label, key]) => (
          <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}><span>{label}</span><div style={{ display: "flex", alignItems: "center", gap: 4 }}><input type="number" style={{ ...S.input, width: 60, padding: "4px 8px", textAlign: "center" }} value={shuConfig[key]} onChange={e => updateShuConfig({ ...shuConfig, [key]: parseInt(e.target.value) || 0 })} /><span>%</span></div></div>
        ))}
        <div style={{ fontSize: 12, color: (shuConfig.pctTransaksi + shuConfig.pctSimpanan + shuConfig.pctCadangan) === 100 ? "#16A34A" : "#DC2626", fontWeight: 600 }}>Total: {shuConfig.pctTransaksi + shuConfig.pctSimpanan + shuConfig.pctCadangan}%{(shuConfig.pctTransaksi + shuConfig.pctSimpanan + shuConfig.pctCadangan) !== 100 ? " (harus 100%)" : ""}</div>
      </div></div>
      <div style={S.sectionTitle}>Ringkasan</div>
      <div style={{ ...S.card, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 14 }}><span>Laba kotor</span><span style={{ fontWeight: 700 }}>Rp {fmt(labaKotor)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#64748B" }}><span>Transaksi ({shuConfig.pctTransaksi}%)</span><span>Rp {fmt(Math.round(labaKotor * shuConfig.pctTransaksi / 100))}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#64748B" }}><span>Simpanan ({shuConfig.pctSimpanan}%)</span><span>Rp {fmt(Math.round(labaKotor * shuConfig.pctSimpanan / 100))}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13, color: "#64748B" }}><span>Cadangan ({shuConfig.pctCadangan}%)</span><span>Rp {fmt(Math.round(labaKotor * shuConfig.pctCadangan / 100))}</span></div>
      </div>
      <div style={S.sectionTitle}>SHU per anggota</div>
      {activeMembers.map(m => { const shu = hitungSHU(m.id); return (<div key={m.id} style={S.card}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.nama}</div><div style={{ fontSize: 11, color: "#64748B" }}>Poin: {m.poin || 0} - Simpanan: Rp {fmt(((simpananWajib[m.id] || []).length * SIMPANAN_WAJIB) + (simpananPokok[m.id]?.lunas ? SIMPANAN_POKOK : 0))}</div></div><div style={{ fontSize: 16, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(shu)}</div></div></div>); })}
    </>)}

    {sub === "notif" && (<>
      <button style={{ ...S.btn(), marginBottom: 12 }} onClick={() => setShowNotifForm(true)}>+ Buat notifikasi baru</button>
      <div style={S.sectionTitle}>Notifikasi terkirim ({notifikasi.length})</div>
      {notifikasi.length === 0 && <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Belum ada notifikasi</div>}
      {notifikasi.map(n => {
        const dibacaCount = Object.keys(n.dibaca || {}).length;
        const tipeLabel = TIPE_NOTIF.find(t => t.value === n.tipe)?.label || n.tipe;
        const tipeColor = n.tipe === "promo" ? "#F59E0B" : n.tipe === "produk_baru" ? "#2563EB" : "#16A34A";
        return (
          <div key={n.id} style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <span style={{ ...S.badge("low"), background: tipeColor + "20", color: tipeColor, fontSize: 10 }}>{tipeLabel}</span>
              <button style={{ background: "none", border: "none", color: "#DC2626", fontSize: 12, cursor: "pointer" }} onClick={() => hapusNotifikasi(n.id)}>Hapus</button>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{n.judul}</div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 4 }}>{n.isi}</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94A3B8" }}>
              <span>{n.tgl} - {n.waktu}</span>
              <span>Dibaca: {dibacaCount}/{activeMembers.length}</span>
            </div>
          </div>
        );
      })}
    </>)}

    {/* MODAL PENGELUARAN */}
    {showPengeluaran && (() => { const F = () => { const [f, setF] = useState({ kategori: KATEGORI_PENGELUARAN[0], keterangan: "", jumlah: "" }); const [err, setErr] = useState(""); return (<div style={S.modal} onClick={() => setShowPengeluaran(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Catat pengeluaran</span><button onClick={() => setShowPengeluaran(false)} style={S.closeBtn}>x</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><select style={S.input} value={f.kategori} onChange={e => setF({...f, kategori: e.target.value})}>{KATEGORI_PENGELUARAN.map(k => <option key={k}>{k}</option>)}</select><input style={S.input} placeholder="Keterangan" value={f.keterangan} onChange={e => { setF({...f, keterangan: e.target.value}); setErr(""); }} /><input style={S.input} placeholder="Jumlah (Rp)" type="number" value={f.jumlah} onChange={e => setF({...f, jumlah: e.target.value})} />{err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}<button style={S.btn("#DC2626")} onClick={() => { if (!f.keterangan.trim()) { setErr("Keterangan wajib"); return; } if (!f.jumlah || parseInt(f.jumlah) <= 0) { setErr("Jumlah > 0"); return; } addPengeluaran(f); setShowPengeluaran(false); }}>Simpan</button></div></div></div>); }; return <F />; })()}

    {/* MODAL BUAT NOTIFIKASI */}
    {showNotifForm && (() => {
      const F = () => {
        const [tipe, setTipe] = useState("pengumuman");
        const [judul, setJudul] = useState("");
        const [isi, setIsi] = useState("");
        const [err, setErr] = useState("");
        const [done, setDone] = useState(false);
        const kirim = () => {
          if (!judul.trim()) { setErr("Judul wajib diisi"); return; }
          if (!isi.trim()) { setErr("Isi notifikasi wajib"); return; }
          addNotifikasi({ tipe, judul, isi });
          setDone(true);
        };
        if (done) return (<div style={S.modal} onClick={() => setShowNotifForm(false)}><div style={{ ...S.modalContent, textAlign: "center" }} onClick={e => e.stopPropagation()}><div style={{ fontSize: 24, color: "#16A34A", marginBottom: 8 }}>✓</div><div style={{ fontSize: 16, fontWeight: 600 }}>Notifikasi terkirim</div><div style={{ fontSize: 13, color: "#64748B", margin: "4px 0 16px" }}>Semua anggota akan melihat notifikasi ini</div><button style={S.btn()} onClick={() => setShowNotifForm(false)}>Tutup</button></div></div>);
        return (<div style={S.modal} onClick={() => setShowNotifForm(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
          <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Buat notifikasi</span><button onClick={() => setShowNotifForm(false)} style={S.closeBtn}>x</button></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Tipe</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TIPE_NOTIF.map(t => (<button key={t.value} style={{ ...S.card, marginBottom: 0, padding: "6px 12px", cursor: "pointer", border: tipe === t.value ? "2px solid #2563EB" : "1px solid #E8E4DC", fontWeight: tipe === t.value ? 600 : 400, fontSize: 12 }} onClick={() => setTipe(t.value)}>{t.label}</button>))}
            </div>
            <input style={S.input} placeholder="Judul notifikasi" value={judul} onChange={e => { setJudul(e.target.value); setErr(""); }} />
            <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }} placeholder="Isi notifikasi..." value={isi} onChange={e => setIsi(e.target.value)} />
            {err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}
            <button style={S.btn()} onClick={kirim}>Kirim ke semua anggota</button>
          </div>
        </div></div>);
      }; return <F />;
    })()}

    {showBuktiImg && <div style={{ ...S.modal, alignItems: "center" }} onClick={() => setShowBuktiImg(null)}><img src={showBuktiImg} alt="Bukti" style={{ maxWidth: "90%", maxHeight: "80vh", borderRadius: 12 }} /></div>}
  </>);
}

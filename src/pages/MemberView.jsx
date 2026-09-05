import { useState, useRef } from "react";
import { useData } from "../context/DataContext";
import { BULAN, SIMPANAN_POKOK, SIMPANAN_WAJIB, TAHUN_AKTIF, fmt, tglNow, waktuNow, compressImage } from "../config";
import S from "../styles";

export default function MemberView() {
  const { user, members, simpananPokok, simpananWajib, pembayaran, currentMonth, hitungSHU, logout, addPembayaran } = useData();
  const [showBayar, setShowBayar] = useState(false);

  const me = members.find(m => m.id === user.id);
  const pokok = simpananPokok[user.id]; const wajib = simpananWajib[user.id] || [];
  const totalWajib = wajib.length * SIMPANAN_WAJIB;
  const mySHU = hitungSHU(user.id);
  const myPembayaran = pembayaran.filter(p => p.anggotaId === user.id);

  return (
    <div style={S.app}>
      <div style={S.header}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><img src="/logo.png" alt="BAZARA" style={{ height: 28 }} /><div style={{ fontSize: 15, fontWeight: 600 }}>Hai, {me?.nama?.split(" ")[0]}</div></div><button onClick={logout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>Keluar</button></div>
      <div style={S.content}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Simpanan pokok</div><div style={{ fontSize: 18, fontWeight: 600, color: pokok?.lunas ? "#16A34A" : "#DC2626", marginTop: 2 }}>{pokok?.lunas ? "Lunas" : "Belum"}</div></div>
          <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Simpanan wajib</div><div style={{ fontSize: 18, fontWeight: 600, color: "#2563EB", marginTop: 2 }}>Rp {fmt(totalWajib)}</div></div>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Poin belanja</div><div style={{ fontSize: 18, fontWeight: 600, color: "#F59E0B", marginTop: 2 }}>{me?.poin || 0}</div></div>
          <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Estimasi SHU</div><div style={{ fontSize: 18, fontWeight: 600, color: "#16A34A", marginTop: 2 }}>Rp {fmt(mySHU)}</div></div>
        </div>
        <div style={S.card}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Simpanan wajib {TAHUN_AKTIF}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{BULAN.map((b, i) => (<div key={i} style={S.monthDot(wajib.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")}>{b.charAt(0)}</div>))}</div><div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "#64748B" }}><span>🟢 Lunas</span><span>🔴 Belum</span><span>⚪ Belum jatuh tempo</span></div></div>
        <div style={S.card}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Data pribadi</div>{[["Nama", me?.nama], ["No. Anggota", me?.id], ["Alamat", me?.alamat], ["No. HP", me?.hp], ["Tgl masuk", me?.tglMasuk]].map(([l,v]) => (<div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13 }}><span style={{ color: "#64748B" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>))}</div>
        <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total simpanan</div><div style={{ fontSize: 24, fontWeight: 700, color: "#2563EB" }}>Rp {fmt((pokok?.lunas ? SIMPANAN_POKOK : 0) + totalWajib)}</div></div>
        <button style={{ ...S.btn(), marginTop: 8 }} onClick={() => setShowBayar(true)}>Kirim bukti pembayaran</button>
        {myPembayaran.length > 0 && (<><div style={S.sectionTitle}>Riwayat pembayaran</div>{myPembayaran.slice(0,10).map(p => (<div key={p.id} style={{ ...S.card, borderLeft: `3px solid ${p.status === "diterima" ? "#16A34A" : p.status === "ditolak" ? "#DC2626" : "#F59E0B"}` }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{p.jenis}</div><div style={{ fontSize: 11, color: "#64748B" }}>{p.tgl}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 700 }}>Rp {fmt(p.jumlah)}</div><span style={S.badge(p.status === "diterima" ? "aktif" : p.status === "ditolak" ? "non-aktif" : "low")}>{p.status}</span></div></div></div>))}</>)}
      </div>
      {showBayar && <BayarModal userId={user.id} onClose={() => setShowBayar(false)} addPembayaran={addPembayaran} />}
    </div>
  );
}

function BayarModal({ userId, onClose, addPembayaran }) {
  const [jenis, setJenis] = useState("Simpanan wajib");
  const [jumlah, setJumlah] = useState(""); const [buktiText, setBuktiText] = useState(""); const [buktiImg, setBuktiImg] = useState(null);
  const [ket, setKet] = useState(""); const [err, setErr] = useState(""); const [done, setDone] = useState(false); const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const handleFile = async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); setBuktiImg(await compressImage(f)); setUploading(false); };
  const kirim = () => {
    if (!jumlah || parseInt(jumlah) <= 0) { setErr("Jumlah harus diisi"); return; }
    if (!buktiText.trim() && !buktiImg) { setErr("Upload bukti atau isi no. referensi"); return; }
    addPembayaran({ id: `PB-${Date.now()}`, anggotaId: userId, tgl: tglNow(), waktu: waktuNow(), jenis, jumlah: parseInt(jumlah), bukti: buktiText, buktiImg: buktiImg || "", status: "menunggu", keterangan: ket || jenis });
    setDone(true);
  };
  if (done) return (<div style={S.modal} onClick={onClose}><div style={{ ...S.modalContent, textAlign: "center" }} onClick={e => e.stopPropagation()}><div style={{ fontSize: 24, color: "#16A34A", marginBottom: 8 }}>✓</div><div style={{ fontSize: 16, fontWeight: 600 }}>Pembayaran terkirim</div><div style={{ fontSize: 13, color: "#64748B", margin: "4px 0 16px" }}>Menunggu konfirmasi admin</div><button style={S.btn()} onClick={onClose}>Tutup</button></div></div>);
  return (<div style={S.modal} onClick={onClose}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
    <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Bukti pembayaran</span><button onClick={onClose} style={S.closeBtn}>✕</button></div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <select style={S.input} value={jenis} onChange={e => setJenis(e.target.value)}><option>Simpanan wajib</option><option>Simpanan pokok</option><option>Angsuran simpanan pokok</option></select>
      <input style={S.input} placeholder="Jumlah (Rp)" type="number" value={jumlah} onChange={e => setJumlah(e.target.value)} />
      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Upload bukti transfer</div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFile} style={{ fontSize: 13 }} />
      {uploading && <p style={{ fontSize: 12, color: "#64748B" }}>Mengompresi...</p>}
      {buktiImg && <img src={buktiImg} alt="Bukti" style={{ width: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 8, border: "1px solid #E8E4DC" }} />}
      <input style={S.input} placeholder="No. referensi (opsional)" value={buktiText} onChange={e => setBuktiText(e.target.value)} />
      <input style={S.input} placeholder="Keterangan (opsional)" value={ket} onChange={e => setKet(e.target.value)} />
      <div style={{ fontSize: 12, color: "#64748B", background: "#F1F5F9", padding: 10, borderRadius: 8 }}>Transfer ke:<br/><strong>Bank: [ISI NAMA BANK]</strong><br/><strong>No. Rek: [ISI NO REKENING]</strong><br/><strong>A/N: Koperasi BAZARA</strong></div>
      {err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}
      <button style={S.btn()} onClick={kirim}>Kirim</button>
    </div>
  </div></div>);
}

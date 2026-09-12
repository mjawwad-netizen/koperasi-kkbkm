import { useState, useRef, useMemo } from "react";
import { useData } from "../context/DataContext";
import { BULAN, SIMPANAN_POKOK, SIMPANAN_WAJIB, TAHUN_AKTIF, fmt, tglNow, waktuNow, compressImage } from "../config";
import S from "../styles";

export default function MemberView() {
  const { user, members, simpananPokok, simpananWajib, barang, pembayaran, notifikasi, currentMonth, hitungSHU, logout, addPembayaran, tandaiBaca } = useData();
  const [showBayar, setShowBayar] = useState(false);
  const [tab, setTab] = useState("beranda");
  const [filterKat, setFilterKat] = useState("Semua");
  const [searchKatalog, setSearchKatalog] = useState("");
  const [showNotif, setShowNotif] = useState(false);

  const me = members.find(m => m.id === user.id);
  const pokok = simpananPokok[user.id]; const wajib = simpananWajib[user.id] || [];
  const totalWajib = wajib.length * SIMPANAN_WAJIB;
  const mySHU = hitungSHU(user.id);
  const myPembayaran = pembayaran.filter(p => p.anggotaId === user.id);

  // Notif belum dibaca
  const unreadCount = useMemo(() => {
    const belumBayarNotif = !wajib.includes(currentMonth) ? 1 : 0;
    const unreadAdmin = notifikasi.filter(n => !(n.dibaca && n.dibaca[user.id])).length;
    return belumBayarNotif + unreadAdmin;
  }, [notifikasi, wajib, currentMonth, user.id]);

  const kategoriList = useMemo(() => ["Semua", ...new Set(barang.map(b => b.kategori))], [barang]);
  const filteredKatalog = useMemo(() => barang.filter(b => {
    const matchSearch = !searchKatalog || b.nama.toLowerCase().includes(searchKatalog.toLowerCase());
    const matchKat = filterKat === "Semua" || b.kategori === filterKat;
    return matchSearch && matchKat && b.stok > 0;
  }), [barang, searchKatalog, filterKat]);

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><img src="/logo.png" alt="BAZARA" style={{ height: 32, borderRadius: 8 }} /><div><div style={{ fontSize: 16, fontWeight: 700 }}>Hai, {me?.nama?.split(" ")[0]}</div><div style={{ fontSize: 10, opacity: 0.8 }}>{user.id}</div></div></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setShowNotif(true)} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 10, width: 36, height: 36, cursor: "pointer", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-bell" style={{ fontSize: 18 }}></i>
            {unreadCount > 0 && <span style={{ position: "absolute", top: -3, right: -3, background: "#EF4444", color: "white", fontSize: 8, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{unreadCount}</span>}
          </button>
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", color: "white", borderRadius: 10, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}><i className="ti ti-logout" style={{ marginRight: 4, fontSize: 14 }}></i>Keluar</button>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #E2E8F0", background: "white" }}>
        <button style={S.tabBtn(tab === "beranda")} onClick={() => setTab("beranda")}>Beranda</button>
        <button style={S.tabBtn(tab === "katalog")} onClick={() => setTab("katalog")}>Katalog</button>
      </div>

      <div style={S.content}>
        {tab === "beranda" && (<>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Simpanan pokok</div><div style={{ fontSize: 18, fontWeight: 600, color: pokok?.lunas ? "#16A34A" : "#DC2626", marginTop: 2 }}>{pokok?.lunas ? "Lunas" : "Belum"}</div></div>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Simpanan wajib</div><div style={{ fontSize: 18, fontWeight: 600, color: "#2563EB", marginTop: 2 }}>Rp {fmt(totalWajib)}</div></div>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Poin belanja</div><div style={{ fontSize: 18, fontWeight: 600, color: "#F59E0B", marginTop: 2 }}>{me?.poin || 0}</div></div>
            <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Estimasi SHU</div><div style={{ fontSize: 18, fontWeight: 600, color: "#16A34A", marginTop: 2 }}>Rp {fmt(mySHU)}</div></div>
          </div>

          {/* NOTIF SIMPANAN BELUM BAYAR */}
          {!wajib.includes(currentMonth) && (
            <div style={{ ...S.card, background: "#FEF3C7", border: "1px solid #FCD34D", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <div><div style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>Simpanan wajib {BULAN[currentMonth]} belum dibayar</div><div style={{ fontSize: 12, color: "#A16207" }}>Segera bayar Rp {fmt(SIMPANAN_WAJIB)}</div></div>
            </div>
          )}

          <div style={S.card}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Simpanan wajib {TAHUN_AKTIF}</div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{BULAN.map((b, i) => (<div key={i} style={S.monthDot(wajib.includes(i) ? "paid" : i > currentMonth ? "future" : "unpaid")}>{b.charAt(0)}</div>))}</div><div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11, color: "#64748B" }}><span>🟢 Lunas</span><span>🔴 Belum</span><span>⚪ Belum jatuh tempo</span></div></div>
          <div style={S.card}><div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Data pribadi</div>{[["Nama", me?.nama], ["No. Anggota", me?.id], ["Alamat", me?.alamat], ["No. HP", me?.hp], ["Tgl masuk", me?.tglMasuk]].map(([l, v]) => (<div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F1F5F9", fontSize: 13 }}><span style={{ color: "#64748B" }}>{l}</span><span style={{ fontWeight: 500 }}>{v}</span></div>))}</div>
          <div style={{ ...S.card, textAlign: "center" }}><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Total simpanan</div><div style={{ fontSize: 24, fontWeight: 700, color: "#2563EB" }}>Rp {fmt((pokok?.lunas ? SIMPANAN_POKOK : 0) + totalWajib)}</div></div>
          <button style={{ ...S.btn(), marginTop: 8 }} onClick={() => setShowBayar(true)}>Kirim bukti pembayaran</button>
          {myPembayaran.length > 0 && (<><div style={S.sectionTitle}>Riwayat pembayaran</div>{myPembayaran.slice(0, 10).map(p => (<div key={p.id} style={{ ...S.card, borderLeft: "3px solid " + (p.status === "diterima" ? "#16A34A" : p.status === "ditolak" ? "#DC2626" : "#F59E0B") }}><div style={{ display: "flex", justifyContent: "space-between" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{p.jenis}</div><div style={{ fontSize: 11, color: "#64748B" }}>{p.tgl}</div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 14, fontWeight: 700 }}>Rp {fmt(p.jumlah)}</div><span style={S.badge(p.status === "diterima" ? "aktif" : p.status === "ditolak" ? "non-aktif" : "low")}>{p.status}</span></div></div></div>))}</>)}
        </>)}

        {tab === "katalog" && (<>
          <input style={{ ...S.input, marginBottom: 8 }} placeholder="Cari produk..." value={searchKatalog} onChange={e => setSearchKatalog(e.target.value)} />
          <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
            {kategoriList.map(k => (<button key={k} style={{ ...S.btnSm(filterKat === k ? "#2563EB" : "#E8E4DC"), color: filterKat === k ? "white" : "#64748B", whiteSpace: "nowrap", fontSize: 11 }} onClick={() => setFilterKat(k)}>{k}</button>))}
          </div>
          {filteredKatalog.length === 0 && <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Tidak ada produk</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {filteredKatalog.map(b => (
              <div key={b.id} style={{ ...S.card, marginBottom: 0, padding: 0, overflow: "hidden" }}>
                {b.foto ? <img src={b.foto} alt={b.nama} style={{ width: "100%", height: 120, objectFit: "cover" }} /> : <div style={{ width: "100%", height: 120, background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8", fontSize: 32 }}>📦</div>}
                <div style={{ padding: "8px 10px" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{b.nama}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 4 }}>{b.kategori}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(b.hargaJual)}</div>
                    <span style={{ fontSize: 10, color: b.stok <= 5 ? "#DC2626" : "#16A34A", fontWeight: 600 }}>{b.stok <= 5 ? "Stok sedikit" : "Tersedia"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>)}
      </div>

      {/* PANEL NOTIFIKASI */}
      {showNotif && (
        <div style={S.modal} onClick={() => setShowNotif(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
          <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Notifikasi</span><button onClick={() => setShowNotif(false)} style={S.closeBtn}>x</button></div>

          {!wajib.includes(currentMonth) && (
            <div style={{ ...S.card, background: "#FEF3C7", border: "1px solid #FCD34D" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#92400E" }}>Simpanan wajib {BULAN[currentMonth]} belum dibayar</div>
              <div style={{ fontSize: 12, color: "#A16207" }}>Segera bayar Rp {fmt(SIMPANAN_WAJIB)} melalui menu pembayaran</div>
            </div>
          )}

          {notifikasi.length === 0 && wajib.includes(currentMonth) && <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Tidak ada notifikasi</div>}

          {notifikasi.map(n => {
            const isRead = n.dibaca && n.dibaca[user.id];
            const tipeColor = n.tipe === "promo" ? "#F59E0B" : n.tipe === "produk_baru" ? "#2563EB" : "#16A34A";
            const tipeLabel = n.tipe === "promo" ? "Promo" : n.tipe === "produk_baru" ? "Produk baru" : n.tipe === "info" ? "Info" : "Pengumuman";
            return (
              <div key={n.id} style={{ ...S.card, opacity: isRead ? 0.7 : 1, borderLeft: isRead ? "3px solid #CBD5E1" : "3px solid " + tipeColor }} onClick={() => { if (!isRead) tandaiBaca(n.id, user.id); }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, fontWeight: 600, background: tipeColor + "20", color: tipeColor }}>{tipeLabel}</span>
                  <span style={{ fontSize: 10, color: "#94A3B8" }}>{n.tgl}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{n.judul}</div>
                <div style={{ fontSize: 13, color: "#64748B" }}>{n.isi}</div>
                {!isRead && <div style={{ fontSize: 11, color: tipeColor, fontWeight: 600, marginTop: 4 }}>Baru</div>}
              </div>
            );
          })}
        </div></div>
      )}

      {showBayar && <BayarModal userId={user.id} onClose={() => setShowBayar(false)} addPembayaran={addPembayaran} />}
    </div>
  );
}

function BayarModal({ userId, onClose, addPembayaran }) {
  const { simpananPokok, simpananWajib } = useData();
  const pokok = simpananPokok[userId];
  const [jenis, setJenis] = useState("Simpanan wajib");
  const [jumlahBulan, setJumlahBulan] = useState(1);
  const [buktiText, setBuktiText] = useState(""); const [buktiImg, setBuktiImg] = useState(null);
  const [ket, setKet] = useState(""); const [err, setErr] = useState(""); const [done, setDone] = useState(false); const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const handleFile = async (e) => { const f = e.target.files?.[0]; if (!f) return; setUploading(true); setBuktiImg(await compressImage(f)); setUploading(false); };

  let jumlahBayar = 0; let labelBayar = "";
  if (jenis === "Simpanan wajib") { jumlahBayar = jumlahBulan * SIMPANAN_WAJIB; labelBayar = jumlahBulan + " bulan x Rp " + fmt(SIMPANAN_WAJIB) + " = Rp " + fmt(jumlahBayar); }
  else { const skema = pokok?.skemaAngsur || 1; const terbayar = pokok?.terbayar || 0; jumlahBayar = SIMPANAN_POKOK / skema; labelBayar = skema === 1 ? "Lunas: Rp " + fmt(SIMPANAN_POKOK) : "Angsuran ke-" + (terbayar + 1) + " dari " + skema + ": Rp " + fmt(jumlahBayar); }

  const kirim = () => {
    if (!buktiText.trim() && !buktiImg) { setErr("Upload bukti atau isi no. referensi"); return; }
    const kf = jenis === "Simpanan wajib" ? jumlahBulan + " bulan (" + (ket || "") + ")" : (pokok?.skemaAngsur === 1 ? "Lunas" : "Angsuran ke-" + ((pokok?.terbayar || 0) + 1)) + " (" + (ket || "") + ")";
    addPembayaran({ id: "PB-" + Date.now(), anggotaId: userId, tgl: tglNow(), waktu: waktuNow(), jenis: jenis, jumlah: jumlahBayar, bukti: buktiText, buktiImg: buktiImg || "", status: "menunggu", keterangan: kf });
    setDone(true);
  };

  if (done) return (<div style={S.modal} onClick={onClose}><div style={{ ...S.modalContent, textAlign: "center" }} onClick={e => e.stopPropagation()}><div style={{ fontSize: 24, color: "#16A34A", marginBottom: 8 }}>✓</div><div style={{ fontSize: 16, fontWeight: 600 }}>Pembayaran terkirim</div><div style={{ fontSize: 13, color: "#64748B", margin: "4px 0 16px" }}>Menunggu konfirmasi admin</div><button style={S.btn()} onClick={onClose}>Tutup</button></div></div>);

  return (<div style={S.modal} onClick={onClose}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
    <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Bukti pembayaran</span><button onClick={onClose} style={S.closeBtn}>x</button></div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Jenis pembayaran</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button style={S.btnSm(jenis === "Simpanan wajib" ? "#2563EB" : "#CBD5E1")} onClick={() => setJenis("Simpanan wajib")}>Simpanan wajib</button>
        {!pokok?.lunas && <button style={S.btnSm(jenis === "Simpanan pokok" ? "#2563EB" : "#CBD5E1")} onClick={() => setJenis("Simpanan pokok")}>Simpanan pokok</button>}
      </div>
      {jenis === "Simpanan wajib" && (<><div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Bayar berapa bulan?</div><div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{[1, 2, 3, 6, 12].map(n => (<button key={n} style={{ ...S.card, marginBottom: 0, padding: "8px 14px", cursor: "pointer", border: jumlahBulan === n ? "2px solid #2563EB" : "1px solid #E8E4DC", fontWeight: jumlahBulan === n ? 600 : 400, fontSize: 13 }} onClick={() => setJumlahBulan(n)}>{n} bln</button>))}</div></>)}
      {jenis === "Simpanan pokok" && (<div style={{ ...S.card, background: "#EFF6FF", border: "1px solid #BFDBFE" }}><div style={{ fontSize: 13, color: "#64748B" }}>Skema: {pokok?.skemaAngsur === 1 ? "Lunas langsung" : "Angsur " + pokok?.skemaAngsur + "x"}</div><div style={{ fontSize: 13, color: "#64748B" }}>Sudah bayar: {pokok?.terbayar || 0} dari {pokok?.skemaAngsur || 1}</div></div>)}
      <div style={{ ...S.card, background: "#F0FDF4", border: "1px solid #BBF7D0", textAlign: "center" }}><div style={{ fontSize: 12, color: "#166534" }}>{labelBayar}</div><div style={{ fontSize: 22, fontWeight: 700, color: "#16A34A", marginTop: 4 }}>Rp {fmt(jumlahBayar)}</div></div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>Upload bukti transfer</div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ fontSize: 13 }} />
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

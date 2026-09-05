import { useState, useMemo } from "react";
import { useData } from "../context/DataContext";
import { POIN_PER_RP, STOK_WARNING, fmt, tglNow } from "../config";
import S from "../styles";

const KODE_KATEGORI = { Sembako: "SMB", Bumbu: "BMB", Makanan: "MKN", Minuman: "MNM", Kebersihan: "KBR", Lainnya: "LN" };

export default function Kasir() {
  const { barang, transaksi, activeMembers, lowStock, prosesTransaksi, addBarang, updateBarang, restokBarang } = useData();
  const [sub, setSub] = useState("kasir");
  const [searchB, setSearchB] = useState("");
  const [cart, setCart] = useState([]);
  const [bayarNom, setBayarNom] = useState("");
  const [pembeliType, setPembeliType] = useState("umum");
  const [pembeliId, setPembeliId] = useState("");
  const [pembeliNama, setPembeliNama] = useState("");
  const [showStruk, setShowStruk] = useState(null);
  const [showHistori, setShowHistori] = useState(false);
  const [showBarangForm, setShowBarangForm] = useState(false);
  const [editB, setEditB] = useState(null);
  const [showRestok, setShowRestok] = useState(null);
  const [filterKat, setFilterKat] = useState("Semua");

  const cartTotal = cart.reduce((s, c) => s + c.hargaJual * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);
  const todayTrx = transaksi.filter(t => t.tgl === tglNow());
  const todayOmzet = todayTrx.reduce((s, t) => s + t.total, 0);

  const kategoriList = useMemo(() => {
    const cats = [...new Set(barang.map(b => b.kategori))];
    return ["Semua", ...cats];
  }, [barang]);

  const filteredBarang = useMemo(() => {
    return barang.filter(b => {
      const matchSearch = !searchB || b.nama.toLowerCase().includes(searchB.toLowerCase()) || b.kode.toLowerCase().includes(searchB.toLowerCase());
      const matchKat = filterKat === "Semua" || b.kategori === filterKat;
      return matchSearch && matchKat;
    });
  }, [barang, searchB, filterKat]);

  // Auto kode barang
  const generateKode = (kategori) => {
    const prefix = KODE_KATEGORI[kategori] || "LN";
    const existing = barang.filter(b => b.kode.startsWith(prefix)).map(b => parseInt(b.kode.replace(prefix, "")) || 0);
    const next = existing.length > 0 ? Math.max(...existing) + 1 : 1;
    return `${prefix}${String(next).padStart(3, "0")}`;
  };

  const addToCart = (item) => {
    if (item.stok <= 0) return;
    const ex = cart.find(c => c.id === item.id);
    if (ex) { if (ex.qty >= item.stok) return; setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)); }
    else setCart([...cart, { ...item, qty: 1 }]);
  };
  const updateQty = (id, d) => {
    const item = barang.find(b => b.id === id);
    setCart(cart.map(c => { if (c.id !== id) return c; const nq = c.qty + d; if (nq <= 0) return null; if (nq > item.stok) return c; return { ...c, qty: nq }; }).filter(Boolean));
  };

  const handleBayar = () => {
    const nom = parseInt(bayarNom.replace(/\D/g, "")) || 0;
    if (nom < cartTotal) return;
    const pembeli = pembeliType === "anggota"
      ? { type: "anggota", id: pembeliId, nama: activeMembers.find(m => m.id === pembeliId)?.nama || "" }
      : { type: "umum", id: null, nama: pembeliNama || "Umum" };
    const trx = prosesTransaksi(cart, nom, pembeli);
    setCart([]); setBayarNom(""); setPembeliType("umum"); setPembeliId(""); setPembeliNama(""); setSearchB(""); setShowStruk(trx);
  };

  // NOTA PRINT
  const printNota = (trx) => {
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;
    const items = trx.items.map(it => `<tr><td style="padding:2px 0">${it.nama}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">Rp ${fmt(it.harga)}</td><td style="text-align:right">Rp ${fmt(it.subtotal)}</td></tr>`).join("");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nota</title><style>*{margin:0;padding:0;font-family:monospace;font-size:12px}body{padding:10px;max-width:380px;margin:0 auto}.center{text-align:center}hr{border:none;border-top:1px dashed #000;margin:6px 0}table{width:100%;border-collapse:collapse}td{padding:3px 0}.right{text-align:right}.bold{font-weight:700}@media print{.no-print{display:none}}</style></head><body>
      <div class="center"><strong style="font-size:16px">KOPERASI BAZARA</strong><br>Kabupaten Malang<br><hr></div>
      <div>No: ${trx.id}<br>Tanggal: ${trx.tgl} ${trx.waktu}<br>Kasir: Admin<br>Pembeli: ${trx.pembeli?.nama || "-"}${trx.pembeli?.type === "anggota" ? ` (${trx.pembeli.id})` : ""}</div><hr>
      <table><tr class="bold"><td>Barang</td><td style="text-align:center">Qty</td><td style="text-align:right">Harga</td><td style="text-align:right">Total</td></tr>${items}</table><hr>
      <table><tr class="bold"><td>TOTAL</td><td class="right" style="font-size:14px">Rp ${fmt(trx.total)}</td></tr><tr><td>Bayar</td><td class="right">Rp ${fmt(trx.bayar)}</td></tr><tr><td>Kembalian</td><td class="right">Rp ${fmt(trx.kembalian)}</td></tr></table><hr>
      ${trx.pembeli?.type === "anggota" ? `<div class="center">+${Math.floor(trx.total / POIN_PER_RP)} poin untuk anggota</div><hr>` : ""}
      <div class="center">Terima kasih<br>Dari kita untuk kita</div>
      <div class="center no-print" style="margin-top:16px"><button onclick="window.print()" style="padding:8px 24px;font-size:14px;cursor:pointer">🖨 Cetak</button> <button onclick="window.close()" style="padding:8px 24px;font-size:14px;cursor:pointer">Tutup</button></div>
    </body></html>`);
    w.document.close();
  };

  return (<>
    <div style={{ display: "flex", gap: 0, marginBottom: 12, borderBottom: "1px solid #E2E8F0" }}>
      <button style={S.tabBtn(sub === "kasir")} onClick={() => setSub("kasir")}>Kasir</button>
      <button style={S.tabBtn(sub === "stok")} onClick={() => setSub("stok")}>Stok</button>
    </div>

    {sub === "kasir" && (<>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Transaksi</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{todayTrx.length}</div></div>
        <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Omzet hari ini</div><div style={{ fontSize: 20, fontWeight: 700, color: "#16A34A" }}>Rp {fmt(todayOmzet)}</div></div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="Cari barang..." value={searchB} onChange={e => setSearchB(e.target.value)} />
        <button style={{ ...S.btnSm("#64748B"), whiteSpace: "nowrap" }} onClick={() => setShowHistori(true)}>Riwayat</button>
      </div>

      {/* FILTER KATEGORI */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
        {kategoriList.map(k => (
          <button key={k} style={{ ...S.btnSm(filterKat === k ? "#2563EB" : "#E8E4DC"), color: filterKat === k ? "white" : "#64748B", whiteSpace: "nowrap", fontSize: 11 }} onClick={() => setFilterKat(k)}>{k}</button>
        ))}
      </div>

      {/* LIST BARANG */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        {filteredBarang.map(b => {
          const inCart = cart.find(c => c.id === b.id);
          return (
            <div key={b.id} style={{ ...S.card, marginBottom: 0, padding: "10px", cursor: b.stok > 0 ? "pointer" : "default", opacity: b.stok <= 0 ? 0.5 : 1 }} onClick={() => addToCart(b)}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{b.nama}</div>
              <div style={{ fontSize: 14, color: "#2563EB", fontWeight: 700 }}>Rp {fmt(b.hargaJual)}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span style={{ fontSize: 11, color: b.stok <= STOK_WARNING ? "#DC2626" : "#94A3B8" }}>Stok: {b.stok}</span>
                {inCart && <span style={{ background: "#2563EB", color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{inCart.qty}×</span>}
              </div>
            </div>
          );
        })}
      </div>
      {filteredBarang.length === 0 && <div style={{ textAlign: "center", padding: 20, color: "#94A3B8", fontSize: 13 }}>Tidak ada barang ditemukan</div>}

      {/* KERANJANG */}
      {cart.length > 0 && (<>
        <div style={S.sectionTitle}>Keranjang ({cartCount} item)</div>
        {cart.map(c => (
          <div key={c.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nama}</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>Rp {fmt(c.hargaJual)} × {c.qty} = <span style={{ color: "#2563EB", fontWeight: 600 }}>Rp {fmt(c.hargaJual * c.qty)}</span></div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button style={S.qtyBtn} onClick={() => updateQty(c.id, -1)}>−</button>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{c.qty}</span>
              <button style={S.qtyBtn} onClick={() => updateQty(c.id, 1)}>+</button>
              <button style={{ ...S.qtyBtn, background: "#DC2626", marginLeft: 4, fontSize: 12 }} onClick={() => setCart(cart.filter(x => x.id !== c.id))}>✕</button>
            </div>
          </div>
        ))}

        {/* PEMBELI */}
        <div style={{ ...S.card, background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Pembeli</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button style={S.btnSm(pembeliType === "anggota" ? "#2563EB" : "#CBD5E1")} onClick={() => setPembeliType("anggota")}>Anggota</button>
            <button style={S.btnSm(pembeliType === "umum" ? "#2563EB" : "#CBD5E1")} onClick={() => setPembeliType("umum")}>Bukan anggota</button>
          </div>
          {pembeliType === "anggota"
            ? <select style={S.input} value={pembeliId} onChange={e => setPembeliId(e.target.value)}><option value="">-- Pilih anggota --</option>{activeMembers.map(m => <option key={m.id} value={m.id}>{m.nama} ({m.id})</option>)}</select>
            : <input style={S.input} placeholder="Nama pembeli (opsional)" value={pembeliNama} onChange={e => setPembeliNama(e.target.value)} />}
          {pembeliType === "anggota" && pembeliId && <div style={{ fontSize: 11, color: "#16A34A", marginTop: 6 }}>+{Math.floor(cartTotal / POIN_PER_RP)} poin</div>}
        </div>

        {/* TOTAL & BAYAR */}
        <div style={{ ...S.card, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><span style={{ fontSize: 15, fontWeight: 600 }}>Total</span><span style={{ fontSize: 18, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(cartTotal)}</span></div>
          <input style={{ ...S.input, marginBottom: 8 }} placeholder="Nominal bayar" value={bayarNom} onChange={e => setBayarNom(e.target.value)} type="number" />
          {bayarNom && parseInt(bayarNom) >= cartTotal && <div style={{ fontSize: 13, color: "#16A34A", fontWeight: 500, marginBottom: 8 }}>Kembalian: Rp {fmt(parseInt(bayarNom) - cartTotal)}</div>}
          <button style={S.btn(parseInt(bayarNom || 0) >= cartTotal && (pembeliType === "umum" || pembeliId) ? "#16A34A" : "#CBD5E1")} onClick={handleBayar} disabled={parseInt(bayarNom || 0) < cartTotal || (pembeliType === "anggota" && !pembeliId)}>Proses pembayaran</button>
        </div>
      </>)}
    </>)}

    {/* STOK */}
    {sub === "stok" && (<>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Jenis</div><div style={{ fontSize: 20, fontWeight: 700, color: "#2563EB" }}>{barang.length}</div></div>
        <div style={S.statCard}><div style={{ fontSize: 11, color: "#64748B" }}>Stok rendah</div><div style={{ fontSize: 20, fontWeight: 700, color: lowStock.length > 0 ? "#DC2626" : "#16A34A" }}>{lowStock.length}</div></div>
      </div>
      {lowStock.length > 0 && (<><div style={S.sectionTitle}>⚠ Perlu restok</div>{lowStock.map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "3px solid #F59E0B" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div><div style={{ fontSize: 12, color: "#64748B" }}>Stok: <span style={{ color: "#DC2626", fontWeight: 600 }}>{b.stok}</span></div></div><button style={S.btnSm("#F59E0B")} onClick={() => setShowRestok(b)}>Restok</button></div>))}</>)}
      <div style={S.sectionTitle}>Semua barang</div>
      {barang.map(b => (<div key={b.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{b.nama}</div><div style={{ fontSize: 11, color: "#64748B" }}>{b.kode} · {b.kategori}</div><div style={{ fontSize: 12, marginTop: 2 }}><span style={{ color: "#64748B" }}>Beli: Rp {fmt(b.hargaBeli)}</span> · <span style={{ color: "#2563EB", fontWeight: 500 }}>Jual: Rp {fmt(b.hargaJual)}</span></div></div><div style={{ textAlign: "right" }}><div style={{ fontSize: 16, fontWeight: 700, color: b.stok <= STOK_WARNING ? "#DC2626" : "#1E293B" }}>{b.stok}</div><div style={{ display: "flex", gap: 4, marginTop: 4 }}><button style={S.btnSm("#64748B")} onClick={() => setEditB(b)}>Edit</button><button style={S.btnSm("#F59E0B")} onClick={() => setShowRestok(b)}>+Stok</button></div></div></div>))}
      <button style={S.fab} onClick={() => setShowBarangForm(true)}>+</button>
    </>)}

    {/* MODALS */}
    {showBarangForm && (() => {
      const F = () => {
        const [f, setF] = useState({ kode: generateKode("Sembako"), nama: "", kategori: "Sembako", hargaBeli: "", hargaJual: "", stok: "" });
        const [err, setErr] = useState("");
        const handleKat = (kat) => setF({ ...f, kategori: kat, kode: generateKode(kat) });
        return (<div style={S.modal} onClick={() => setShowBarangForm(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}>
          <div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Tambah barang</span><button onClick={() => setShowBarangForm(false)} style={S.closeBtn}>✕</button></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <select style={S.input} value={f.kategori} onChange={e => handleKat(e.target.value)}>{["Sembako","Bumbu","Makanan","Minuman","Kebersihan","Lainnya"].map(k => <option key={k}>{k}</option>)}</select>
            <div style={{ ...S.input, background: "#F1F5F9", color: "#64748B" }}>Kode: <strong>{f.kode}</strong> (otomatis)</div>
            <input style={S.input} placeholder="Nama barang" value={f.nama} onChange={e => { setF({ ...f, nama: e.target.value }); setErr(""); }} />
            <div style={{ display: "flex", gap: 8 }}>
              <input style={S.input} placeholder="Harga beli" type="number" value={f.hargaBeli} onChange={e => setF({ ...f, hargaBeli: e.target.value })} />
              <input style={S.input} placeholder="Harga jual" type="number" value={f.hargaJual} onChange={e => setF({ ...f, hargaJual: e.target.value })} />
            </div>
            <input style={S.input} placeholder="Stok awal" type="number" value={f.stok} onChange={e => setF({ ...f, stok: e.target.value })} />
            {err && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{err}</p>}
            <button style={S.btn()} onClick={() => { if (!f.nama.trim()) { setErr("Nama wajib"); return; } if (!f.hargaJual) { setErr("Harga jual wajib"); return; } addBarang({ ...f, hargaBeli: parseInt(f.hargaBeli) || 0, hargaJual: parseInt(f.hargaJual) || 0, stok: parseInt(f.stok) || 0 }); setShowBarangForm(false); }}>Simpan</button>
          </div>
        </div></div>);
      }; return <F />;
    })()}

    {editB && (() => { const F = () => { const [f, setF] = useState(editB); return (<div style={S.modal} onClick={() => setEditB(null)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Edit barang</span><button onClick={() => setEditB(null)} style={S.closeBtn}>✕</button></div><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><div style={{ ...S.input, background: "#F1F5F9", color: "#64748B" }}>Kode: <strong>{f.kode}</strong></div><input style={S.input} placeholder="Nama" value={f.nama} onChange={e => setF({...f, nama: e.target.value})} /><select style={S.input} value={f.kategori} onChange={e => setF({...f, kategori: e.target.value})}>{["Sembako","Bumbu","Makanan","Minuman","Kebersihan","Lainnya"].map(k => <option key={k}>{k}</option>)}</select><div style={{ display: "flex", gap: 8 }}><input style={S.input} placeholder="H. beli" type="number" value={f.hargaBeli} onChange={e => setF({...f, hargaBeli: e.target.value})} /><input style={S.input} placeholder="H. jual" type="number" value={f.hargaJual} onChange={e => setF({...f, hargaJual: e.target.value})} /></div><button style={S.btn()} onClick={() => { updateBarang({ ...f, hargaBeli: parseInt(f.hargaBeli)||0, hargaJual: parseInt(f.hargaJual)||0 }); setEditB(null); }}>Simpan</button></div></div></div>); }; return <F />; })()}

    {showRestok && (() => { const F = () => { const [qty, setQty] = useState(""); const [biaya, setBiaya] = useState(""); return (<div style={S.modal} onClick={() => setShowRestok(null)}><div style={{ ...S.modalContent, paddingBottom: 24 }} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Restok: {showRestok.nama}</span><button onClick={() => setShowRestok(null)} style={S.closeBtn}>✕</button></div><div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>Stok: <strong>{showRestok.stok}</strong></div><input style={{ ...S.input, marginBottom: 8 }} placeholder="Jumlah" type="number" value={qty} onChange={e => setQty(e.target.value)} /><input style={{ ...S.input, marginBottom: 10 }} placeholder="Total biaya (Rp)" type="number" value={biaya} onChange={e => setBiaya(e.target.value)} /><button style={S.btn()} onClick={() => { if (parseInt(qty) > 0) { restokBarang(showRestok.id, parseInt(qty), parseInt(biaya) || 0); setShowRestok(null); } }}>Tambah</button></div></div>); }; return <F />; })()}

    {/* STRUK + NOTA */}
    {showStruk && (<div style={S.modal} onClick={() => setShowStruk(null)}><div style={{ ...S.modalContent, textAlign: "center" }} onClick={e => e.stopPropagation()}>
      <div style={{ fontSize: 24, color: "#16A34A", marginBottom: 8 }}>✓</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>Transaksi berhasil</div>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4 }}>{showStruk.tgl} · {showStruk.waktu}</div>
      {showStruk.pembeli && <div style={{ fontSize: 12, color: "#2563EB", marginBottom: 12 }}>{showStruk.pembeli.nama}{showStruk.pembeli.type === "anggota" ? ` (+${Math.floor(showStruk.total / POIN_PER_RP)} poin)` : ""}</div>}
      <div style={{ textAlign: "left", borderTop: "1px dashed #CBD5E1", paddingTop: 12 }}>
        {showStruk.items.map((it, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}><span>{it.nama} ×{it.qty}</span><span style={{ fontWeight: 500 }}>Rp {fmt(it.subtotal)}</span></div>))}
        <div style={{ borderTop: "1px dashed #CBD5E1", marginTop: 8, paddingTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700 }}><span>Total</span><span>Rp {fmt(showStruk.total)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748B", marginTop: 4 }}><span>Bayar</span><span>Rp {fmt(showStruk.bayar)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16A34A", fontWeight: 500 }}><span>Kembalian</span><span>Rp {fmt(showStruk.kembalian)}</span></div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button style={{ ...S.btn(), flex: 1 }} onClick={() => { printNota(showStruk); }}>🖨 Cetak nota</button>
        <button style={{ ...S.btn("#64748B"), flex: 1 }} onClick={() => setShowStruk(null)}>Tutup</button>
      </div>
    </div></div>)}

    {showHistori && (<div style={S.modal} onClick={() => setShowHistori(false)}><div style={S.modalContent} onClick={e => e.stopPropagation()}><div style={S.modalHeader}><span style={{ fontSize: 16, fontWeight: 600 }}>Riwayat transaksi</span><button onClick={() => setShowHistori(false)} style={S.closeBtn}>✕</button></div>{transaksi.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: "#94A3B8", fontSize: 13 }}>Belum ada</div> : transaksi.slice(0, 20).map(t => (<div key={t.id} style={{ ...S.card, cursor: "pointer" }} onClick={() => { setShowHistori(false); setShowStruk(t); }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontSize: 13, fontWeight: 600 }}>{t.tgl} · {t.waktu}</div><div style={{ fontSize: 11, color: "#64748B" }}>{t.pembeli?.nama || "—"} · {t.items.length} item</div></div><div style={{ fontSize: 15, fontWeight: 700, color: "#2563EB" }}>Rp {fmt(t.total)}</div></div></div>))}</div></div>)}
  </>);
}

import { useState } from "react";
import { useData } from "../context/DataContext";
import { OPSI_ANGSURAN, SIMPANAN_POKOK, fmt } from "../config";
import S from "../styles";

export default function Register({ onBack }) {
  const { register } = useData();
  const [f, setF] = useState({ nama: "", alamat: "", hp: "", pin: "", pinConfirm: "", angsuran: 0 });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = () => {
    setError(""); setSuccess("");
    const res = register(f);
    if (res.ok) { setSuccess(`Berhasil! No. anggota: ${res.id}. Login dengan No. HP + PIN.`); setF({ nama: "", alamat: "", hp: "", pin: "", pinConfirm: "", angsuran: 0 }); }
    else setError(res.error);
  };

  return (
    <div style={{ ...S.app, padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 20 }}><img src="/logo.png" alt="BAZARA" style={{ width: 180 }} /></div>
      <div style={{ fontSize: 18, fontWeight: 700, textAlign: "center", marginBottom: 16, color: "#2563EB" }}>Pendaftaran Anggota</div>
      <div style={{ width: "100%", maxWidth: 360, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <input style={S.input} placeholder="Nama lengkap" value={f.nama} onChange={e => setF({...f, nama: e.target.value})} />
        <input style={S.input} placeholder="Alamat" value={f.alamat} onChange={e => setF({...f, alamat: e.target.value})} />
        <input style={S.input} placeholder="No. HP" value={f.hp} onChange={e => setF({...f, hp: e.target.value})} />
        <input style={S.input} placeholder="Buat PIN (min 4 digit)" type="password" inputMode="numeric" value={f.pin} onChange={e => setF({...f, pin: e.target.value.replace(/\D/g,"")})} maxLength={6} />
        <input style={S.input} placeholder="Ulangi PIN" type="password" inputMode="numeric" value={f.pinConfirm} onChange={e => setF({...f, pinConfirm: e.target.value.replace(/\D/g,"")})} maxLength={6} />
        <div style={{ fontSize: 13, fontWeight: 600, color: "#64748B", marginTop: 4 }}>Pembayaran simpanan pokok (Rp {fmt(SIMPANAN_POKOK)})</div>
        {OPSI_ANGSURAN.map((o, i) => (<label key={i} style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 0, border: f.angsuran === i ? "2px solid #2563EB" : "1px solid #E8E4DC" }}><input type="radio" name="angsuran" checked={f.angsuran === i} onChange={() => setF({...f, angsuran: i})} /><div><div style={{ fontSize: 14, fontWeight: 500 }}>{o.label}</div><div style={{ fontSize: 12, color: "#64748B" }}>Rp {fmt(o.perBulan)}{o.kali > 1 ? ` × ${o.kali} bulan` : ""}</div></div></label>))}
        {error && <p style={{ color: "#DC2626", fontSize: 12, margin: 0 }}>{error}</p>}
        {success && <div style={{ background: "#DCFCE7", color: "#166534", padding: 12, borderRadius: 8, fontSize: 13 }}>{success}</div>}
        <button style={S.btn()} onClick={handleRegister}>Daftar</button>
        <button style={S.btn("transparent")} onClick={onBack}>Kembali ke login</button>
      </div>
    </div>
  );
}

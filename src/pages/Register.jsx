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
    if (res.ok) { setSuccess("Berhasil! No. anggota: " + res.id + ". Login dengan No. HP + PIN."); setF({ nama: "", alamat: "", hp: "", pin: "", pinConfirm: "", angsuran: 0 }); }
    else setError(res.error);
  };

  return (
    <div style={{ ...S.app, padding: 24, background: "linear-gradient(180deg, #1E3A5F 0%, #F5F0EB 40%)" }}>
      <div style={{ textAlign: "center", marginBottom: 16, marginTop: 20 }}>
        <img src="/logo.png" alt="BAZARA" style={{ width: 140, borderRadius: 16, background: "white", padding: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }} />
      </div>
      <div style={{ width: "100%", maxWidth: 380, margin: "0 auto", background: "white", borderRadius: 20, padding: "24px 20px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1E3A5F", marginBottom: 18, textAlign: "center" }}>Pendaftaran Anggota</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={S.input} placeholder="Nama lengkap" value={f.nama} onChange={e => setF({...f, nama: e.target.value})} />
          <input style={S.input} placeholder="Alamat" value={f.alamat} onChange={e => setF({...f, alamat: e.target.value})} />
          <input style={S.input} placeholder="No. HP" value={f.hp} onChange={e => setF({...f, hp: e.target.value})} />
          <input style={S.input} placeholder="Buat PIN (min 4 digit)" type="password" inputMode="numeric" value={f.pin} onChange={e => setF({...f, pin: e.target.value.replace(/\D/g,"")})} maxLength={6} />
          <input style={S.input} placeholder="Ulangi PIN" type="password" inputMode="numeric" value={f.pinConfirm} onChange={e => setF({...f, pinConfirm: e.target.value.replace(/\D/g,"")})} maxLength={6} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "#6B7280", marginTop: 4, letterSpacing: 0.3 }}>Simpanan pokok (Rp {fmt(SIMPANAN_POKOK)})</div>
          {OPSI_ANGSURAN.map((o, i) => (<label key={i} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", marginBottom: 4, border: f.angsuran === i ? "2px solid #2563EB" : "none", boxShadow: f.angsuran === i ? "0 0 0 3px rgba(37,99,235,0.1)" : "0 1px 4px rgba(0,0,0,0.06)" }}><input type="radio" name="angsuran" checked={f.angsuran === i} onChange={() => setF({...f, angsuran: i})} style={{ accentColor: "#2563EB" }} /><div><div style={{ fontSize: 14, fontWeight: 600 }}>{o.label}</div><div style={{ fontSize: 12, color: "#9CA3AF" }}>Rp {fmt(o.perBulan)}{o.kali > 1 ? " x " + o.kali + " bulan" : ""}</div></div></label>))}
          {error && <p style={{ color: "#DC2626", fontSize: 12, margin: 0, textAlign: "center" }}>{error}</p>}
          {success && <div style={{ background: "#DCFCE7", color: "#166534", padding: 14, borderRadius: 12, fontSize: 13, fontWeight: 500 }}><i className="ti ti-check" style={{ marginRight: 6 }}></i>{success}</div>}
          <button style={S.btn()} onClick={handleRegister}><i className="ti ti-user-plus" style={{ marginRight: 6 }}></i>Daftar</button>
          <button style={S.btn("transparent")} onClick={onBack}><i className="ti ti-arrow-left" style={{ marginRight: 6 }}></i>Kembali ke login</button>
        </div>
      </div>
    </div>
  );
}

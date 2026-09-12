import { useState } from "react";
import { useData } from "../context/DataContext";
import S from "../styles";

export default function Login({ onRegister }) {
  const { login } = useData();
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => { const res = login(id, pin); if (!res.ok) setError(res.error); };

  return (
    <div style={{ ...S.app, alignItems: "center", justifyContent: "center", padding: 24, background: "linear-gradient(180deg, #1E3A5F 0%, #F5F0EB 60%)" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ background: "white", borderRadius: 24, padding: 16, display: "inline-block", boxShadow: "0 8px 32px rgba(0,0,0,0.1)", marginBottom: 16 }}>
          <img src="/logo.png" alt="BAZARA" style={{ width: 180 }} />
        </div>
      </div>
      <div style={{ width: "100%", maxWidth: 340, background: "white", borderRadius: 20, padding: "28px 22px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1E3A5F", marginBottom: 20, textAlign: "center" }}>Masuk ke akun Anda</div>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <i className="ti ti-phone" style={{ position: "absolute", left: 14, top: 13, color: "#9CA3AF", fontSize: 18 }}></i>
          <input style={{ ...S.input, paddingLeft: 42 }} placeholder="No. HP atau Nomor Anggota" value={id} onChange={e => setId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <i className="ti ti-lock" style={{ position: "absolute", left: 14, top: 13, color: "#9CA3AF", fontSize: 18 }}></i>
          <input style={{ ...S.input, paddingLeft: 42 }} type="password" placeholder="PIN" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        </div>
        {error && <p style={{ color: "#DC2626", fontSize: 12, margin: "0 0 10px", textAlign: "center" }}>{error}</p>}
        <button style={{ ...S.btn(), marginBottom: 12, marginTop: 6 }} onClick={handleLogin}>
          <i className="ti ti-login" style={{ marginRight: 6 }}></i>Masuk
        </button>
        <button style={S.btn("transparent")} onClick={onRegister}>
          <i className="ti ti-user-plus" style={{ marginRight: 6 }}></i>Daftar jadi anggota
        </button>
      </div>
    </div>
  );
}

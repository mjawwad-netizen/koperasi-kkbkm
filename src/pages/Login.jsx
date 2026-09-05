import { useState } from "react";
import { useData } from "../context/DataContext";
import S from "../styles";

export default function Login({ onRegister }) {
  const { login } = useData();
  const [id, setId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    const res = login(id, pin);
    if (!res.ok) setError(res.error);
  };

  return (
    <div style={{ ...S.app, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}><img src="/logo.png" alt="BAZARA" style={{ width: 200 }} /></div>
      <div style={{ width: "100%", maxWidth: 320 }}>
        <input style={{ ...S.input, marginBottom: 10 }} placeholder="No. HP atau Nomor Anggota" value={id} onChange={e => setId(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        <input style={{ ...S.input, marginBottom: 8 }} type="password" placeholder="PIN" inputMode="numeric" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
        {error && <p style={{ color: "#DC2626", fontSize: 12, margin: "0 0 8px" }}>{error}</p>}
        <button style={{ ...S.btn(), marginBottom: 10 }} onClick={handleLogin}>Masuk</button>
        <button style={S.btn("transparent")} onClick={onRegister}>Daftar jadi anggota</button>
      </div>
    </div>
  );
}

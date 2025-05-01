"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.access_token) throw new Error("Invalid login");

      localStorage.setItem("token", data.access_token);
      alert("✅ Logged in!");
      router.push("/create");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.overlay}></div>

      {/* 🔨 Logo Top-Right */}
      <div className={styles.brand}>OAKHURST DEVELOPMENT</div>

      {/* 🧾 Login Card */}
      <div className={styles.card}>
        <h2 className={styles.title}>Login</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input name="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <button type="submit">Login</button>
        </form>
        {error && <p className={styles.error}>{error}</p>}

        {/* 🔗 Register Link */}
        <p className={styles.registerText}>
          Not a user?{" "}
          <span onClick={() => router.push("/auth/register")} className={styles.registerLink}>
            Register here
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;

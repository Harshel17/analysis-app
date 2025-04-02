"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

const LoginPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
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
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input name="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Login</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default LoginPage;

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css";

const RegisterPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Registration failed");
      alert("✅ Registered Successfully");
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className={styles.authContainer}>
      <img src="/construst.jpg" className={styles.backgroundImage} alt="Background" />

      <h1 className={styles.brandTopLeft}> OAKHURST DEVELOPMENT</h1>

      <div className={styles.card}>
        <h2 className={styles.title}>Register</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input name="username" placeholder="Username" onChange={handleChange} required />
          <input name="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <button type="submit">Register</button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
        <p style={{ marginTop: "10px", color: "#cbd5e1" }}>
          Already have an account?{" "}
          <a href="/auth/login" className={styles.link}>
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./auth.module.css"; // you can reuse/create

const RegisterPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    is_manager: 0,
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

      if (!res.ok) throw new Error("Signup failed");
      alert("✅ Registered successfully!");
      router.push("/auth/login");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }
  };

  return (
    <div className={styles.authContainer}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input name="username" placeholder="Username" onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
        <button type="submit">Register</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default RegisterPage;

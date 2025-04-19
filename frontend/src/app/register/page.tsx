"use client";

import { useSearchParams } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";

interface JwtPayload {
  name: string;
  email: string;
}

function navigate(url: any) {
  window.location.href = url
}

export default function Page() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [info, setInfo] = useState({ name: "", email: ""});
  const [tel, setTel] = useState("");
  const [password, setPassword] = useState("")
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode<JwtPayload>(token);
      setInfo({
        name: decoded.name,
        email: decoded.email,
      });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const telRegex = /^(0[0-9]{9})$/;
    if (!telRegex.test(tel)) {
      setError("Invalid phone number format");
      return;
    }

    console.log('name', info.name)
    console.log('email', info.email)
    console.log('password', password)
    console.log('tel', tel)

    try {
      const res = await fetch("http://localhost:5000/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: info.name,
          email: info.email,
          password: password,
          tel: tel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Something went wrong");
      }

      setSuccess("Registration successful!");
      setError("");
      navigate("http://localhost:3000");
    } catch (err: any) {
      setError(err.message || "Submission failed");
      setSuccess("");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen w-screen">
      <h1 className="text-xl font-bold mb-5">Complete Your Profile</h1>
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="mb-3 gap-2 w-full">
          <label className="pr-2">Name:</label>
          <input
            value={info.name}
            readOnly
            className="w-4/5 border-gray-400 border-2 rounded-md pl-1 pb-1"
          />
        </div>

        {/* Email */}
        <div className="mb-3 gap-2 w-full">
          <label className="pr-2">Email:</label>
          <input
            value={info.email}
            readOnly
            className="w-4/5 border-gray-400 border-2 rounded-md pl-1"
          />
        </div>

        {/* Password */}
        <div className="mb-3 gap-2 w-full">
          <label className="pr-2">Password:</label>
          <input
            type="password"
            minLength={6}
            className="w-4/5 border-gray-400 border-2 rounded-md pl-1"
            placeholder="Enter your password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Telephone number */}
        <div className="mb-3 gap-2 w-full">
          <label className="pr-2">Phone Number:</label>
          <input
            type="tel"
            placeholder="Enter phone number"
            className="w-4/5 border-gray-400 border-2 rounded-md pl-1 pb-1"
            pattern="0[689][0-9]{8}"
            required
            title="Please enter a valid phone number"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 mb-2">{error}</p>}
        {success && <p className="text-green-600 mb-2">{success}</p>}

        <button
          type="submit"
          className="bg-blue-500 text-white rounded-md p-2 hover:cursor-pointer hover:bg-blue-800"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

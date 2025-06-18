// src/pages/LoginRegisterPage.jsx
import React, { useState } from "react";
import axios from "axios";

export default function LoginRegisterPage({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("male");
  const [ageGroup, setAgeGroup] = useState("20s");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    if (!isLogin) {
      formData.append("gender", gender);
      formData.append("age_group", ageGroup);
    }

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const res = await axios.post(`http://localhost:8000${endpoint}`, formData);
      if (isLogin) {
        setUser(res.data.user);
      } else {
        alert("회원가입 성공! 로그인해주세요");
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "오류 발생");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-80 space-y-4"
      >
        <h2 className="text-xl font-semibold text-center">
          {isLogin ? "로그인" : "회원가입"}
        </h2>
        <input
          className="w-full p-2 border rounded"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full p-2 border rounded"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {!isLogin && (
          <>
            <select
              className="w-full p-2 border rounded"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
            <select
              className="w-full p-2 border rounded"
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
            >
              <option value="10">10대</option>
              <option value="20">20대</option>
              <option value="30">30대</option>
              <option value="40">40대</option>
              <option value="50">50대</option>
              <option value="60">60대 이상</option>
            </select>
          </>
        )}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          {isLogin ? "로그인" : "회원가입"}
        </button>
        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-center text-blue-600 cursor-pointer"
        >
          {isLogin ? "회원가입하기" : "로그인하기"}
        </p>
      </form>
    </div>
  );
}

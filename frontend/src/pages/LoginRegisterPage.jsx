// src/pages/LoginRegisterPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginRegisterPage({ setUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("male");
  const [ageGroup, setAgeGroup] = useState("20");
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
        localStorage.setItem("user", JSON.stringify(res.data.user)); // 로그인 성공시 로컬 스토리지 저장
        navigate("/");
      } else {
        alert("회원가입 성공! 로그인해주세요");
        setIsLogin(true);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "오류 발생");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm space-y-5"
      >
        {/* 앱 로고 / 상호명 */}
        <h1 className="text-3xl font-extrabold text-green-600 text-center mb-2">
          DailyValue
        </h1>

        <h2 className="text-lg font-semibold text-center text-gray-800">
          {isLogin ? "로그인" : "회원가입"}
        </h2>

        <input
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
          placeholder="아이디"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {!isLogin && (
          <>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
            <select
              className="w-full p-2 border border-gray-300 rounded-md"
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
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition"
        >
          {isLogin ? "로그인" : "회원가입"}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-sm text-center text-green-600 hover:underline cursor-pointer"
        >
          {isLogin ? "아직 회원이 아니신가요? 회원가입하기" : "이미 계정이 있나요? 로그인하기"}
        </p>
      </form>
    </div>
  );
}

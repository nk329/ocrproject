from fastapi import APIRouter, HTTPException, Form
import bcrypt
from db import get_db

router = APIRouter()

@router.post("/register")
def register(
    username: str = Form(...),
    password: str = Form(...),
    gender: str = Form(...),
    age_group: str = Form(...)
):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    # 사용자 중복 확인
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자입니다.")

    # 비밀번호 해시
    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    # DB에 저장
    cursor.execute(
        "INSERT INTO users (username, password, gender, age_group) VALUES (%s, %s, %s, %s)",
        (username, hashed_pw.decode("utf-8"), gender, age_group)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "회원가입 완료"}

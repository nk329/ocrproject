from fastapi import APIRouter, HTTPException, Form
import bcrypt
from db import conn, cursor

router = APIRouter()

@router.post("/register")
def register(
    username: str = Form(...),
    password: str = Form(...),
    gender: str = Form(...),
    age_group: str = Form(...)
):
    # 사용자 중복 확인
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="이미 존재하는 사용자입니다.")

    # 비밀번호 해시
    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    # DB에 저장
    cursor.execute(
        "INSERT INTO users (username, password, gender, age_group) VALUES (%s, %s, %s, %s)",
        (username, hashed_pw.decode("utf-8"), gender, age_group)
    )
    conn.commit()
    return {"message": "회원가입 완료"}


@router.post("/login")
def login(
    username: str = Form(...),
    password: str = Form(...)
):
    cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
    user = cursor.fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="사용자가 존재하지 않습니다.")

    if not bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
        raise HTTPException(status_code=401, detail="비밀번호가 일치하지 않습니다.")

    return {
        "message": "로그인 성공",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "gender": user["gender"],
            "age_group": user["age_group"]
        }
    }

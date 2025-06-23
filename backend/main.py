from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from tempfile import NamedTemporaryFile
from shutil import copyfileobj
from routers.auth_routes import router as auth_router
from routers import auth
from db import conn, cursor  # DB 연결
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import date, timedelta, datetime
import pytz # pytz 임포트
import bcrypt # bcrypt 임포트 확인

import os
import easyocr
from dotenv import load_dotenv
from openai import AsyncOpenAI

from ocr.preprocess import preprocess_image
from ocr.extractor import extract_value , extract_calorie
from ocr.constants import NUTRIENT_BASES

# .env 파일에서 환경 변수 로드
load_dotenv()

app = FastAPI()
app.include_router(auth_router)
app.include_router(auth.router, prefix="/auth")

# OpenAI 클라이언트 초기화 (API 키는 환경 변수에서 자동으로 읽어옴)
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

reader = easyocr.Reader(['ko', 'en'], gpu=False)

# 한국 시간대 객체 생성
KST = pytz.timezone('Asia/Seoul')

def get_today_kst():
    """현재 한국 시간을 기준으로 날짜 객체를 반환합니다."""
    return datetime.now(KST).date()

class AskRequest(BaseModel):
    user_id: int
    question: str
    history: List[Dict[str, str]]

async def generate_ai_feedback(nutrients: list, gender: str, age_group: str) -> str:
    if not client.api_key:
        return "OpenAI API 키가 설정되지 않았습니다."

    if not nutrients:
        return "분석된 데이터가 없습니다. 첫 식사를 기록하고 맞춤 피드백을 받아보세요!"

    # 영양소 데이터를 문자열로 변환
    nutrient_summary = "\n".join(
        [f"- {n['name']}: {n['value']}{n['unit']} ({n['percentage']}% of daily value)" for n in nutrients]
    )

    # ChatGPT에 전달할 프롬프트
    prompt = f"""
    당신은 친절하고 유능한 AI 영양 코치입니다.
    다음은 {age_group}대 {gender} 사용자의 하루 누적 영양 섭취량입니다.

    {nutrient_summary}

    이 데이터를 기반으로 아래 형식에 맞춰 한국어로 개인화된 피드백을 제공해주세요:
    1.  **종합 평가**: 현재 식단에 대한 긍정적이고 격려하는 어조의 간단한 요약 (1~2문장).
    2.  **주의할 점**: 섭취량이 너무 높거나 낮은 영양소를 1~2개 짚어주고, 그 이유를 쉽게 설명해주세요.
    3.  **음식 추천**: 식단 균형을 위해 추천할 만한 음식 2~3가지를 구체적으로 제안해주세요.

    전체적으로 전문가적이면서도 이해하기 쉬운 말투를 사용해주세요.
    """

    try:
        completion = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful nutrition assistant providing advice in Korean."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return "AI 피드백을 생성하는 중 오류가 발생했습니다."


#  하루 누적 저장 함수
def save_nutrients(user_id: int, nutrients: list):
    today = get_today_kst() # 한국 시간 기준 오늘 날짜 사용
    for nutrient in nutrients:
        name = nutrient["name"]
        value = float(nutrient["value"])
        unit = nutrient["unit"]

        cursor.execute("""
            SELECT id, value FROM daily_nutrients
            WHERE user_id = %s AND nutrient_name = %s AND date = %s
        """, (user_id, name, today))
        existing = cursor.fetchone()

        if existing:
            new_total = existing["value"] + value
            cursor.execute("UPDATE daily_nutrients SET value = %s WHERE id = %s", (new_total, existing["id"]))
        else:
            cursor.execute("""
                INSERT INTO daily_nutrients (user_id, nutrient_name, value, unit, date)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, name, value, unit, today))
    conn.commit()


def get_today_nutrients(user_id: int, gender: str):
    today = get_today_kst() # 한국 시간 기준 오늘 날짜 사용
    cursor.execute("""
        SELECT nutrient_name, value, unit
        FROM daily_nutrients
        WHERE user_id = %s AND date = %s
    """, (user_id, today))
    rows = cursor.fetchall()

    base = NUTRIENT_BASES[gender]
    name_to_key = {
        "열량": "energy",
        "단백질": "protein",
        "나트륨": "sodium",
        "당류": "sugar",
        "지방": "fat",
        "포화지방": "sat_fat"
    }

    result = []
    for r in rows:
        name = r["nutrient_name"]
        value = float(r["value"])
        unit = r["unit"]
        key = name_to_key.get(name)
        base_val = base.get(key, 1)
        percentage = round(value / base_val * 100)

        result.append({
            "name": name,
            "value": value,
            "unit": unit,
            "percentage": percentage
        })
    return result


@app.get("/user-status/{user_id}")
async def get_user_status(user_id: int):
    # profile_image 컬럼도 함께 조회합니다.
    cursor.execute("SELECT username, gender, age_group, activity_level, health_goal, profile_image FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    if not user:
        return JSONResponse(status_code=404, content={"error": "사용자를 찾을 수 없습니다."})

    username = user["username"]
    gender_db = user["gender"]
    ageGroup = user["age_group"]
    gender = "남성" if gender_db.lower() == "male" else "여성"

    # 누적된 하루치 불러오기
    today_nutrients = get_today_nutrients(user_id=user_id, gender=gender)

    # AI 피드백 생성
    ai_feedback = await generate_ai_feedback(today_nutrients, gender, ageGroup)

    # 응답 데이터에 profile_image 추가
    response = {
        "username": username,
        "gender": gender,
        "ageGroup": ageGroup,
        "activity_level": user["activity_level"],
        "health_goal": user["health_goal"],
        "profile_image": user["profile_image"], # 이미지 데이터 전달
        "nutrients": today_nutrients,
        "ai_feedback": ai_feedback
    }

    return JSONResponse(content=response)


# --- 요청 Body를 위한 Pydantic 모델 정의 ---
class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    gender: Optional[str] = None
    age_group: Optional[str] = None
    activity_level: Optional[str] = None
    health_goal: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

# Pydantic 모델 정의
class Nutrient(BaseModel):
    name: str
    value: float
    unit: str

class AddNutrientsRequest(BaseModel):
    user_id: str
    nutrients: List[Dict[str, Any]]
    date: Optional[str] = None

@app.post("/upload")
async def upload_image(
    image: UploadFile = File(...),
    user_id: str = Form(...)
):
    # 사용자 정보 조회 (성별만 필요)
    cursor.execute("SELECT gender FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    if not user:
        return JSONResponse(status_code=404, content={"error": "사용자를 찾을 수 없습니다."})
    gender = "남성" if user["gender"].lower() == "male" else "여성"
    
    #  이미지 저장 및 전처리
    suffix = os.path.splitext(image.filename)[1]
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        copyfileobj(image.file, tmp)
        tmp_path = tmp.name

    processed_img = preprocess_image(tmp_path)
    if processed_img is None:
        return JSONResponse(status_code=400, content={"error": "이미지 불러오기 실패"})

    result = reader.readtext(processed_img, detail=0)
    print("추출된 텍스트:", result)

    #  OCR 기반 영양소 추출
    base = NUTRIENT_BASES[gender]
    nutrient_info = {
        "열량": ("kcal", extract_value(result, ["열량", "kcal", "칼로리"]), base["energy"]),
        "단백질": ("g", extract_value(result, ["단백질", "protein"]), base["protein"]),
        "나트륨": ("mg", extract_value(result, ["나트륨", "나트롬","나트룹","염분"]), base["sodium"]),
        "당류": ("g", extract_value(result, ["당류","당료", "sugar"]), base["sugar"]),
        "지방": ("g", extract_value(result, ["지방", "fat"]), base["fat"]),
        "포화지방": ("g", extract_value(result, ["포화지방", "satfat", "saturated"]), base["sat_fat"]),
    }

    # OCR로 분석된 값만 반환 (DB 저장 X)
    ocr_nutrients = []
    for name, (unit, val, base_val) in nutrient_info.items():
        ocr_nutrients.append({
            "name": name,
            "value": float(val),
            "unit": unit
        })
        
    os.remove(tmp_path)
    # DB 저장 없이 OCR 결과만 반환
    return JSONResponse(content={"ocr_nutrients": ocr_nutrients})


@app.post("/add-nutrients")
async def add_nutrients(request: AddNutrientsRequest):
    # 사용자가 수정한 최종 데이터를 DB에 저장
    save_nutrients(user_id=request.user_id, nutrients=request.nutrients)
    
    # 사용자 정보 및 업데이트된 누적 데이터 조회 후 반환
    cursor.execute("SELECT username, gender, age_group, activity_level, health_goal, profile_image FROM users WHERE id = %s", (request.user_id,))
    user = cursor.fetchone()
    gender = "남성" if user["gender"].lower() == "male" else "여성"
    
    today_nutrients = get_today_nutrients(user_id=request.user_id, gender=gender)
    ai_feedback = await generate_ai_feedback(today_nutrients, user['gender'], user['age_group'])

    # latestNutrients에 각 영양소별 percentage(이번 음식 기준)를 추가
    name_to_key = {
        "열량": "energy",
        "단백질": "protein",
        "나트륨": "sodium",
        "당류": "sugar",
        "지방": "fat",
        "포화지방": "sat_fat"
    }
    base = NUTRIENT_BASES[gender]
    latest_nutrients_with_percent = []
    for n in request.nutrients:
        key = name_to_key.get(n["name"])
        base_val = base.get(key, 1)
        percent = round(float(n["value"]) / base_val * 100) if base_val else None
        latest_nutrients_with_percent.append({**n, "percentage": percent})

    response = {
        "username": user["username"],
        "gender": gender,
        "ageGroup": user["age_group"],
        "latestNutrients": latest_nutrients_with_percent, # 방금 추가된 영양소 + 이번 음식 기준 충족률
        "nutrients": today_nutrients, # 전체 누적 영양소
        "ai_feedback": ai_feedback
    }
    
    return JSONResponse(content=response)


@app.get("/statistics/{user_id}")
async def get_statistics(user_id: int):
    # 최근 90일간의 데이터 조회
    today_kst = get_today_kst() # 한국 시간 기준 오늘 날짜 사용
    ninety_days_ago = today_kst - timedelta(days=90)
    
    cursor.execute("""
        SELECT date, nutrient_name, value, unit
        FROM daily_nutrients
        WHERE user_id = %s AND date >= %s
        ORDER BY date DESC
    """, (user_id, ninety_days_ago))
    
    rows = cursor.fetchall()

    # 날짜별로 데이터 그룹화
    stats_data = {}
    for r in rows:
        day = r["date"].isoformat() # 'YYYY-MM-DD' 형식의 문자열로 변환
        if day not in stats_data:
            stats_data[day] = []
        
        stats_data[day].append({
            "name": r["nutrient_name"],
            "value": float(r["value"]),
            "unit": r["unit"]
        })
        
    return JSONResponse(content=stats_data)

@app.post("/ask-ai")
async def ask_ai(request: AskRequest):
    # 사용자 정보 및 누적 영양 데이터 조회
    cursor.execute("SELECT gender, age_group FROM users WHERE id = %s", (request.user_id,))
    user = cursor.fetchone()
    if not user:
        return JSONResponse(status_code=404, content={"error": "사용자를 찾을 수 없습니다."})
    
    gender = "남성" if user["gender"].lower() == "male" else "여성"
    today_nutrients = get_today_nutrients(user_id=request.user_id, gender=gender)
    nutrient_summary = "\n".join(
        [f"- {n['name']}: {n['value']}{n['unit']} ({n['percentage']}% of daily value)" for n in today_nutrients]
    )

    # ChatGPT에 전달할 프롬프트 (대화 형식)
    system_prompt = f"""
    당신은 사용자의 영양 데이터를 기반으로 질문에 답변하는 친절하고 유능한 AI 영양 코치입니다.
    현재 사용자는 {user["age_group"]}대 {gender}이며, 오늘의 누적 영양 섭취량은 다음과 같습니다.
    {nutrient_summary}
    이 정보를 바탕으로 사용자의 질문에 답변해주세요. 항상 친절하고 명확하게 한국어로 답변해야 합니다.
    """
    
    # 이전 대화 내용 + 새 질문
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(request.history)
    messages.append({"role": "user", "content": request.question})

    try:
        completion = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            temperature=0.7,
        )
        answer = completion.choices[0].message.content.strip()
        return {"answer": answer}
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return JSONResponse(status_code=500, content={"error": "AI 피드백 생성 중 오류 발생"})

@app.put("/users/{user_id}")
async def update_user_profile(user_id: int, request: UserUpdateRequest):
    update_fields = request.dict(exclude_unset=True)
    if not update_fields:
        return JSONResponse(status_code=400, content={"detail": "수정할 내용이 없습니다."})

    # gender는 DB에 male/female로 저장
    if 'gender' in update_fields:
        update_fields['gender'] = 'male' if update_fields['gender'] == '남성' else 'female'

    set_clause = ", ".join([f"{key} = %s" for key in update_fields])
    values = list(update_fields.values())
    values.append(user_id)

    query = f"UPDATE users SET {set_clause} WHERE id = %s"
    cursor.execute(query, tuple(values))
    conn.commit()

    return {"message": "회원 정보가 성공적으로 수정되었습니다."}

@app.put("/users/{user_id}/password")
async def change_password(user_id: int, request: PasswordChangeRequest):
    cursor.execute("SELECT password FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    if not user:
        return JSONResponse(status_code=404, content={"detail": "사용자를 찾을 수 없습니다."})

    if not bcrypt.checkpw(request.current_password.encode('utf-8'), user["password"].encode('utf-8')):
        return JSONResponse(status_code=400, content={"detail": "현재 비밀번호가 일치하지 않습니다."})

    hashed_new_password = bcrypt.hashpw(request.new_password.encode('utf-8'), bcrypt.gensalt())
    cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_new_password.decode('utf-8'), user_id))
    conn.commit()

    return {"message": "비밀번호가 성공적으로 변경되었습니다."}

@app.delete("/users/{user_id}")
async def delete_user(user_id: int):
    # 사용자와 관련된 모든 데이터를 삭제해야 합니다. (예: daily_nutrients)
    cursor.execute("DELETE FROM daily_nutrients WHERE user_id = %s", (user_id,))
    cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
    conn.commit()
    return {"message": "회원 탈퇴가 성공적으로 처리되었습니다."}

# 프로필 이미지 업로드를 위한 요청 모델
class ProfileImageRequest(BaseModel):
    profile_image: str # Base64 인코딩된 이미지 데이터

@app.post("/users/{user_id}/profile-image")
async def upload_profile_image(user_id: int, request: ProfileImageRequest):
    # Base64 이미지 데이터를 DB에 저장
    cursor.execute("UPDATE users SET profile_image = %s WHERE id = %s", (request.profile_image, user_id))
    conn.commit()
    return {"message": "프로필 이미지가 성공적으로 업데이트되었습니다."}

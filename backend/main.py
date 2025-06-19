from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from tempfile import NamedTemporaryFile
from shutil import copyfileobj
from routers.auth_routes import router as auth_router
from routers import auth
from db import conn, cursor  # DB 연결

import os
import easyocr
from datetime import date

from ocr.preprocess import preprocess_image
from ocr.extractor import extract_value , extract_calorie
from ocr.constants import NUTRIENT_BASES

app = FastAPI()
app.include_router(auth_router)
app.include_router(auth.router, prefix="/auth")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

reader = easyocr.Reader(['ko', 'en'], gpu=False)


# ✅ 하루 누적 저장 함수
def save_nutrients(user_id: int, nutrients: list):
    today = date.today()
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
    today = date.today()
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


@app.post("/upload")
async def upload_image(
    image: UploadFile = File(...),
    user_id: str = Form(...)
):
    #  사용자 정보 조회
    cursor.execute("SELECT username, gender, age_group FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()
    if not user:
        return JSONResponse(status_code=404, content={"error": "사용자 정보를 찾을 수 없습니다."})

    username = user["username"]
    gender = user["gender"]
    ageGroup = user["age_group"]
    gender = "남성" if gender.lower() == "male" else "여성"

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
    calorie = extract_calorie(result)
    nutrient_info = {
        "열량": ("kcal", extract_value(result, ["열량", "kcal", "칼로리"]), base["energy"]),
        "단백질": ("g", extract_value(result, ["단백질", "protein"]), base["protein"]),
        "나트륨": ("mg", extract_value(result, ["나트륨", "나트롬","나트룹","염분"]), base["sodium"]),
        "당류": ("g", extract_value(result, ["당류","당료", "sugar"]), base["sugar"]),
        "지방": ("g", extract_value(result, ["지방", "fat"]), base["fat"]),
        "포화지방": ("g", extract_value(result, ["포화지방", "satfat", "saturated"]), base["sat_fat"]),
    }

    # ✅ 현재 인식된 값
    nutrients = []
    for name, (unit, val, base_val) in nutrient_info.items():
        val = float(val)
        nutrients.append({
            "name": name,
            "value": val,
            "unit": unit,
            "percentage": round(val / base_val * 100)
        })

    # ✅ 하루 누적 DB 저장
    save_nutrients(user_id=int(user_id), nutrients=nutrients)

    # ✅ 누적된 하루치 불러오기 + 퍼센트 재계산
    today_nutrients = get_today_nutrients(user_id=int(user_id), gender=gender)

    # ✅ 경고 및 피드백
    response = {
        "username": username,
        "gender": gender,
        "ageGroup": ageGroup,
        "latestNutrients": nutrients,   # ✅ 이 줄을 추가해야 React 쪽에서 테이블이 나옴
        "nutrients": today_nutrients,
        "warnings": [],
        "advices": []
    }

    na = next((n for n in today_nutrients if n["name"] == "나트륨"), None)
    pro = next((n for n in today_nutrients if n["name"] == "단백질"), None)

    if na and na["percentage"] > 50:
        response["warnings"].append("나트륨이 50% 이상입니다.")
    if pro and pro["percentage"] < 20:
        response["advices"].append("단백질이 적은 편입니다.")
    else:
        response["advices"].append("단백질은 적절한 수준입니다.")

    os.remove(tmp_path)
    return JSONResponse(content=response)

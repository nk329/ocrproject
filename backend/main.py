from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from tempfile import NamedTemporaryFile
from shutil import copyfileobj
import os
import easyocr

from ocr.preprocess import preprocess_image
from ocr.extractor import extract_value
from ocr.constants import NUTRIENT_BASES

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

reader = easyocr.Reader(['ko', 'en'], gpu=False)

@app.post("/upload")
async def upload_image(
    image: UploadFile = File(...),
    gender: str = Form(...),
    ageGroup: str = Form(...)
):
    suffix = os.path.splitext(image.filename)[1]
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        copyfileobj(image.file, tmp)
        tmp_path = tmp.name

    processed_img = preprocess_image(tmp_path)
    if processed_img is None:
        return JSONResponse(status_code=400, content={"error": "이미지 불러오기 실패"})

    result = reader.readtext(processed_img, detail=0)
    print("추출된 텍스트:", result)

    base = NUTRIENT_BASES[gender]
    nutrient_info = {
        "열량": ("kcal", extract_value(result, ["열량", "kcal", "칼로리"]), base["energy"]),
        "단백질": ("g", extract_value(result, ["단백질", "protein"]), base["protein"]),
        "나트륨": ("mg", extract_value(result, ["나트륨", "나트롬", "염분"]), base["sodium"]),
        "당류": ("g", extract_value(result, ["당류", "sugar"]), base["sugar"]),
        "지방": ("g", extract_value(result, ["지방", "fat"]), base["fat"]),
        "포화지방": ("g", extract_value(result, ["포화지방", "satfat", "saturated"]), base["sat_fat"]),
    }

    nutrients = []
    for name, (unit, val, base_val) in nutrient_info.items():
        val = float(val)
        nutrients.append({
            "name": name,
            "value": val,
            "unit": unit,
            "percentage": round(val / base_val * 100)
        })

    response = {
        "gender": gender,
        "ageGroup": ageGroup,
        "nutrients": nutrients,
        "warnings": [],
        "advices": []
    }

    if float(nutrient_info["나트륨"][1]) > base["sodium"] * 0.5:
        response["warnings"].append("나트륨이 50% 이상입니다.")
    if float(nutrient_info["단백질"][1]) < base["protein"] * 0.2:
        response["advices"].append("단백질이 적은 편입니다.")
    else:
        response["advices"].append("단백질은 적절한 수준입니다.")

    os.remove(tmp_path)
    return JSONResponse(content=response)

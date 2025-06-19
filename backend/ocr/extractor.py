def extract_value(lines, keywords):
    replace_map = {
        'O': '0', 'o': '0',
        'I': '1', 'l': '1',
        'Z': '2', 'S': '5',
        'B': '8', 'A': '4'
    }

    def normalize_token(token):
        token = token.replace(',', '.')  # OCR 콤마 → 점 처리
        return ''.join(replace_map.get(c, c) for c in token)

    for idx, line in enumerate(lines):
        norm_line = line.replace(" ", "").lower()
        for keyword in keywords:
            if keyword in norm_line:
                for token in line.split():
                    token = normalize_token(token)
                    try:
                        return float(''.join(c for c in token if c.isdigit() or c == '.'))
                    except:
                        continue
                if idx + 1 < len(lines):
                    for token in lines[idx + 1].split():
                        token = normalize_token(token)
                        try:
                            return float(''.join(c for c in token if c.isdigit() or c == '.'))
                        except:
                            continue
    return 0.0


def extract_calorie(lines):
    keywords = ["열량", "칼로리", "kcal", "energy", "총", "총열량"]
    replace_map = {'O': '0', 'o': '0', 'I': '1', 'l': '1', 'Z': '2', 'S': '5', 'B': '8', 'A': '4'}

    def normalize_token(token):
        token = token.replace(',', '.')
        return ''.join(replace_map.get(c, c) for c in token)

    for idx, line in enumerate(lines):
        lower = line.lower().replace(" ", "")
        if any(k in lower for k in keywords):
            tokens = line.split()
            for t in tokens:
                t_norm = normalize_token(t)
                if 'kcal' in t_norm:
                    t_norm = t_norm.replace('kcal', '')
                try:
                    return float(''.join(c for c in t_norm if c.isdigit() or c == '.'))
                except:
                    continue
        # 한 줄 아래에 있는 경우도 시도
        if any(k in lower for k in keywords) and idx + 1 < len(lines):
            for t in lines[idx + 1].split():
                t_norm = normalize_token(t)
                try:
                    return float(''.join(c for c in t_norm if c.isdigit() or c == '.'))
                except:
                    continue
    return 0.0

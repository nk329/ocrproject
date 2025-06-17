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

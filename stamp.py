#!/usr/bin/env python3
"""index.html이 부르는 스타일과 스크립트 주소 끝에 판 번호(?v=시각)를 새로 붙인다.

웹에 올리기 전에 한 번 돌린다. 브라우저는 주소가 같으면 예전 파일을 한동안 그대로 쓰는데,
판 번호가 바뀌면 주소가 달라져 새 파일을 받는다.
쓰는 법: python3 stamp.py
"""
import re
import time

PAGE = 'index.html'

with open(PAGE, encoding='utf-8') as f:
    page = f.read()

stamp = str(int(time.time()))
page, count = re.subn(r'((?:href|src)="(?:css|js)/[^"?]+)(?:\?v=\d+)?"', r'\1?v=' + stamp + '"', page)

with open(PAGE, 'w', encoding='utf-8') as f:
    f.write(page)

print('판 번호 %s를 %d곳에 붙였습니다' % (stamp, count))

#!/usr/bin/env python3
"""게임을 여는 작은 서버.

브라우저가 파일을 기억해 두지 못하게 해서, 고친 파일이 새로 고칠 때 바로 보인다.
쓰는 법: python3 serve.py [포트]  →  http://localhost:8765
"""
import http.server
import sys


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    http.server.test(HandlerClass=Handler, port=port, bind='127.0.0.1')

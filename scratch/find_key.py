import urllib.request, re

js_url = 'https://shopeefood.vn/app/assets/js/app-f182e75cd868fe649223.js'
req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

idx = js.find('r=Object(s.c)(t.method.toUpperCase(),n,t.data),o=Object(s.a)(')
print('Context around s.a call:')
print(js[idx:idx+150])

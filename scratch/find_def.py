import urllib.request

js_url = 'https://shopeefood.vn/app/assets/js/app-f182e75cd868fe649223.js'
req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

word = 'AUTH_SIGN' + 'ATURE'
pos = 0
while True:
    idx = js.find(word, pos)
    if idx == -1:
        break
    print(f'Found at {idx}:')
    print(js[max(0, idx-50):idx+100])
    pos = idx + len(word)

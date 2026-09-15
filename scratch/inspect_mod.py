import urllib.request

js_url = 'https://shopeefood.vn/app/assets/js/app-f182e75cd868fe649223.js'
req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

idx = js.find('IkUC:')
if idx != -1:
    print(js[idx:idx+300])
idx2 = js.find('"IkUC":')
if idx2 != -1:
    print(js[idx2:idx2+300])

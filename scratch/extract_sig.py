import urllib.request

js_url = 'https://shopeefood.vn/app/assets/js/app-f182e75cd868fe649223.js'
req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

idx = js.find('IkUC:function(e,t)')
ikuc = js[idx+2500:idx+5000]
print(ikuc)

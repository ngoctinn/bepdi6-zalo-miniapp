import urllib.request, re

# Check vendor bundle
req = urllib.request.Request('https://shopeefood.vn/app/assets/js/vendor-3b0d399ae007ee3b8862.js', headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

m = re.findall(r'AUTH_SIGN[a-zA-Z0-9_]*', js)
print('matches in vendor.js:', set(m))

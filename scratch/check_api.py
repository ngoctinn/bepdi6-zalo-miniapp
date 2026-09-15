import urllib.request, json

url = 'https://gappapi.deliverynow.vn/api/delivery/get_from_url?url=ho-chi-minh/bep-di-6-mam-chung-mien-tay-bui-quang-la.mvq9nn'

# Let's test standard mobile headers without signature
headers = {
    'User-Agent': 'ShopeeFood/3.0.0 (iPhone; iOS 16.0; Scale/3.00)',
    'x-foody-api-version': '1',
    'x-foody-app-type': '1004',
    'x-foody-client-type': '1',
    'x-foody-client-version': '3.0.0',
    'x-foody-client-language': 'vi',
}
r = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(r) as resp:
        print(resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('HTTPError:', e.code, e.headers.get('tracking_id', ''))
    print(e.read().decode('utf-8', errors='ignore'))

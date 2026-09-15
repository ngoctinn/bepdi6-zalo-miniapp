import urllib.request

url = 'https://gappapi.deliverynow.vn/api/delivery/get_from_url?url=ho-chi-minh/bep-di-6-mam-chung-mien-tay-bui-quang-la.mvq9nn'

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'x-foody-client-id': '',
    'x-foody-client-type': '1',
    'x-foody-app-type': '1004',
    'x-foody-client-version': '3.0.0',
    'x-foody-api-version': '1',
}
r = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(r) as resp:
        print(resp.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print('HTTPError:', e.code)
    print(e.read().decode('utf-8'))

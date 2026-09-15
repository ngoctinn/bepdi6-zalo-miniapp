import urllib.request, json

url = 'https://gappapi.deliverynow.vn/api/delivery/get_from_url?url=ho-chi-minh/bep-di-6-mam-chung-mien-tay-bui-quang-la.mvq9nn'

# Test with foody web headers
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'x-foody-client-id': '',
    'x-foody-client-type': '1',
    'x-foody-app-type': '1004',
    'x-foody-client-version': '3.0.0',
    'x-foody-api-version': '1',
    'x-foody-client-language': 'vi',
    'x-foody-access-token': '',
}
for ct in ['1', '2', '3', '4', '10']:
    for at in ['1004', '1000', '1001']:
        headers['x-foody-client-type'] = ct
        headers['x-foody-app-type'] = at
        r = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(r) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                print(f'ct={ct}, at={at}: {data.get("result")}')
                if data.get('result') != 'error_header':
                    print('SUCCESS!', data)
                    break
        except Exception as e:
            pass

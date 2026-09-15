import urllib.request, json, re, hmac, hashlib

js_url = 'https://shopeefood.vn/app/assets/js/app-f182e75cd868fe649223.js'
req = urllib.request.Request(js_url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    js = resp.read().decode('utf-8', errors='ignore')

# Match key safely
m = re.search(r'AUTH_SIGNATURE[^"]+":"([^"]+)"', js)
if not m:
    # try another pattern
    m = re.search(r'"([a-f0-9]{64})"', js)
    print('Hex 64 matches:', m.group(1) if m else 'none')

# Let us find all keys in config
start = js.find('e.exports={VER:"vi"')
end = js.find('};', start)
cfg_text = js[start:end]

# find signature key
sig_key = None
for part in cfg_text.split(','):
    if 'AUTH' in part and ':' in part:
        k, v = part.split(':', 1)
        print('Found config key:', k.strip(), 'val len:', len(v.strip('"')))
        if 'SIGNATURE' in k:
            sig_key = v.strip('"')

print('Signature key found:', bool(sig_key))

def call_api(path, method='GET', data=None):
    full_url = 'https://gappapi.deliverynow.vn' + path
    payload_str = json.dumps(data) if data is not None else 'undefined'
    sign_data = f'{method}|{full_url}|1004,1,3.0.0,|{payload_str}'
    sig = hmac.new(sig_key.encode(), sign_data.encode(), hashlib.sha256).hexdigest()
    auth_header = f'signature {sig}'
    
    headers = {
        'x-foody-client-id': '',
        'x-foody-client-type': '1',
        'x-foody-app-type': '1004',
        'x-foody-client-version': '3.0.0',
        'x-foody-api-version': '1',
        'x-foody-client-language': 'vi',
        'x-foody-access-token': '',
        'Authorization': auth_header,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    if data is not None:
        headers['Content-Type'] = 'application/json;charset=UTF-8'
        body = json.dumps(data).encode('utf-8')
    else:
        body = None
        
    r = urllib.request.Request(full_url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode('utf-8'))

res = call_api('/api/delivery/get_from_url?url=ho-chi-minh/bep-di-6-mam-chung-mien-tay-bui-quang-la.mvq9nn')
print('get_from_url result:', res.get('result'))
print('reply:', json.dumps(res.get('reply', {}), ensure_ascii=False)[:300])

deliv_id = res['reply']['delivery_id']
print('delivery_id:', deliv_id)

detail = call_api(f'/api/delivery/get_detail?id_type=2&request_id={deliv_id}')
print('get_detail result:', detail.get('result'))
with open('scratch/bepdi6_shopee_detail.json', 'w', encoding='utf-8') as f_out:
    json.dump(detail, f_out, ensure_ascii=False, indent=2)

dishes = call_api(f'/api/dish/get_delivery_dishes?id_type=2&request_id={deliv_id}')
print('get_delivery_dishes result:', dishes.get('result'))
with open('scratch/bepdi6_shopee_dishes.json', 'w', encoding='utf-8') as f_out:
    json.dump(dishes, f_out, ensure_ascii=False, indent=2)
print('SUCCESS!')

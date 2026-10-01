import json
import time
import urllib.request
from playwright.sync_api import sync_playwright

data = json.dumps({'zalo_token': 'test_5746042945227030407'}).encode('utf-8')
req = urllib.request.Request(
    'https://enjoying-tweak-borax.ngrok-free.dev/api/v1/auth/zalo',
    data=data,
    headers={'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true'}
)
resp = urllib.request.urlopen(req)
login_res = json.loads(resp.read().decode())
token = login_res['data']['access_token']
refresh = login_res['data']['refresh_token']
print('Admin logged in! Role:', login_res['data']['customer']['role'])

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(
        viewport={'width': 393, 'height': 852},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True
    )
    page = context.new_page()

    page.goto('http://localhost:5173/')
    page.evaluate(f'''() => {{
        localStorage.setItem('bepdi6_access_token', '{token}');
        localStorage.setItem('bepdi6_refresh_token', '{refresh}');
        localStorage.setItem('hide_dev_admin_helper', 'true');
    }}''')

    # 1. Thuc don
    page.goto('http://localhost:5173/', wait_until='networkidle')
    time.sleep(2)
    page.screenshot(path='docs/screenshots/01_thuc_don.png')
    print('1. Saved 01_thuc_don.png')

    # 2. Chi tiet mon
    page.goto('http://localhost:5173/product/1', wait_until='networkidle')
    time.sleep(2)
    page.screenshot(path='docs/screenshots/02_chi_tiet_mon.png')
    print('2. Saved 02_chi_tiet_mon.png')

    # 3. Chon dia chi
    page.goto('http://localhost:5173/select-location', wait_until='networkidle')
    time.sleep(2)
    page.screenshot(path='docs/screenshots/03_chon_dia_chi.png')
    print('3. Saved 03_chon_dia_chi.png')

    # 4. Admin tong quan
    page.goto('http://localhost:5173/admin', wait_until='networkidle')
    time.sleep(2)
    page.screenshot(path='docs/screenshots/04_admin_tong_quan.png')
    print('4. Saved 04_admin_tong_quan.png')

    # 5. Admin Bep KDS
    page.goto('http://localhost:5173/admin/kitchen', wait_until='networkidle')
    time.sleep(2)
    page.screenshot(path='docs/screenshots/05_admin_bep.png')
    print('5. Saved 05_admin_bep.png')

    # 6. Admin Trung tam quan ly
    page.goto('http://localhost:5173/admin/manage', wait_until='networkidle')
    time.sleep(2)
    page.screenshot(path='docs/screenshots/06_admin_trung_tam_quan_ly.png')
    print('6. Saved 06_admin_trung_tam_quan_ly.png')

    # 7. Admin Quan ly mon an
    page.goto('http://localhost:5173/admin/manage/menu/products', wait_until='networkidle')
    time.sleep(2)
    page.screenshot(path='docs/screenshots/07_admin_quan_ly_mon_an.png')
    print('7. Saved 07_admin_quan_ly_mon_an.png')

    # 8. Admin Cai dat quan
    page.goto('http://localhost:5173/admin/settings', wait_until='networkidle')
    time.sleep(2)
    page.screenshot(path='docs/screenshots/08_admin_cai_dat_quan.png')
    print('8. Saved 08_admin_cai_dat_quan.png')

    browser.close()
    print('All demo screenshots captured successfully!')

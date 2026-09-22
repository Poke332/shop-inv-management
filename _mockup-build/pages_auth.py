# Page builders for 13 mockups — Round-3 (docs/design-tokens-round3.md): Roboto 400/500/600,
# §1 type scale, §2 8pt spacing + 44px touch floor, §3.2 filled CTAs.
import sys
sys.path.insert(0, ".")
from lib import *

PAGES = {}

# ---------------------------------------------------------------- AUTH LAYOUT
def auth_layout(title, h1, fields_html, submit_label, link_html):
    sun = '''<div style="position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:210px;height:210px;border-radius:50%;background:var(--ts-400);box-shadow:0 0 110px 34px var(--ts-400) inset,0 26px 70px rgba(13,18,22,.45)"></div>
    <div style="position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);width:126px;height:126px;border-radius:50%;background:var(--ts-500)"></div>'''
    brand = f'''<div style="width:520px;background:var(--bs-900);position:relative;overflow:hidden;display:flex;flex-direction:column;padding:36px 40px">
      <div style="font-weight:600;font-size:22px;line-height:32px;color:#fff">Sunset <span style="color:var(--ts-400)">Electronics</span></div>
      {sun}
      <div style="margin-top:auto;font-size:15px;line-height:24px;font-weight:500;color:var(--bs-50);max-width:330px">Premium audio, smart home, gaming, laptops, wearables &amp; accessories — delivered across Indonesia.</div>
    </div>'''
    form = f'''<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px">
      <div style="background:#fff;border:1px solid var(--bs-200);border-radius:12px;padding:36px 40px;width:450px;box-shadow:0 10px 30px rgba(13,18,22,.06)">
        <div class="h1" style="margin-bottom:24px">{h1}</div>
        {fields_html}
        <button class="btn-p full" style="margin-top:24px">{submit_label} →</button>
        <div style="margin-top:20px;font-size:14px;line-height:20px;font-weight:400;color:var(--bs-700);text-align:center">{link_html}</div>
      </div>
    </div>'''
    body = f'<div style="display:flex;min-height:736px;background:#fff">{brand}{form}</div>'
    return page_wrap(body, "", title)

def text_field(label, ph):
    return f'''<div style="margin-bottom:16px">
      <label class="label">{label}</label>
      <div style="margin-top:8px"><input class="input wfull" placeholder="{ph}"></div>
    </div>'''

def pwd_field(label, ph):
    return f'''<div style="margin-bottom:16px">
      <label class="label">{label}</label>
      <div style="margin-top:8px;position:relative"><input class="input wfull" type="password" value="••••••••••">
        <span style="position:absolute;right:10px;top:11px;font-size:12px;font-weight:500;color:var(--bs-500)">show</span></div>
    </div>'''

PAGES["login"] = auth_layout(
    "Login", "Sign in",
    text_field("Email", "you@example.com") + pwd_field("Password", "Min. 8 characters"),
    "Sign in",
    'New here? <a class="link" href="#">Register</a>')

PAGES["register"] = auth_layout(
    "Register", "Create account",
    text_field("Name", "Jordan Wijaya") + text_field("Email", "you@example.com")
    + pwd_field("Password", "Min. 8 characters") + pwd_field("Confirm password", "Repeat your password"),
    "Create account",
    'Already have an account? <a class="link" href="#">Sign in</a>')

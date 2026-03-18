import re
import json

def css_to_js(css_str):
    styles = {}
    for declaration in css_str.split(';'):
        declaration = declaration.strip()
        if not declaration:
            continue
        if ':' in declaration:
            key, value = declaration.split(':', 1)
            key = key.strip()
            value = value.strip()
            
            # Convert kebab-case to camelCase
            parts = key.split('-')
            if key.startswith('--'):
                # CSS Custom Properties stay as strings
                camel_key = f"'{key}'"
            else:
                camel_key = parts[0] + ''.join(word.capitalize() for word in parts[1:])
                
            styles[camel_key] = value

    # Create the React style object string
    style_parts = []
    for k, v in styles.items():
        if k.startswith("'--"):
            style_parts.append(f"{k}: '{v}'")
        else:
            style_parts.append(f"{k}: '{v}'")
            
    return "{{" + ", ".join(style_parts) + "}}"

def convert_to_jsx(html):
    # Fix classifications
    html = html.replace('class="', 'className="')
    html = html.replace('for="', 'htmlFor="')
    html = html.replace('tabindex="', 'tabIndex="')
    
    # Fix self-closing tags
    html = re.sub(r'<(img|br|input|hr|path)([^>]*?)>', lambda m: f"<{m.group(1)}{m.group(2)}" + ("/" if not m.group(2).endswith("/") else "") + ">", html)
    html = html.replace('stroke-linecap="', 'strokeLinecap="')
    html = html.replace('stroke-width="', 'strokeWidth="')
    html = html.replace('pointer-events="', 'pointerEvents="')
    html = html.replace('fill-rule="', 'fillRule="')
    html = html.replace('clip-rule="', 'clipRule="')
    html = html.replace('stroke-dasharray="', 'strokeDasharray="')
    html = html.replace('clip-path="', 'clipPath="')
    
    # Extract and convert styles
    def replace_style(match):
        css_content = match.group(1)
        js_style = css_to_js(css_content)
        return f"style={js_style}"
        
    html = re.sub(r'style="([^"]*)"', replace_style, html)
    
    return html

with open('_temp/canva_raw.html', 'r') as f:
    raw = f.read()

# Extract the slide that has white bg
start_idx = raw.find('<div class="fMSICA h517IA" aria-hidden="false">')
if start_idx == -1:
    print("Could not find the white slide")
    exit(1)

raw_slide = raw[start_idx:]
# Find the end of this div (cheap way: take the whole string inside and we just extract the _mXnjA div
mxnja_start = raw_slide.find('<div className="_mXnjA"')
if mxnja_start == -1:
    mxnja_start = raw_slide.find('<div class="_mXnjA"')

# We will just parse the whole _mXnjA block.
# Actually let's just use re to extract the _mXnjA block.
import xml.etree.ElementTree as ET
# Using regex to get it is easier because html is not perfectly well formed often.

out = convert_to_jsx(raw)
with open('_temp/canva_jsx.jsx', 'w') as f:
    f.write(out)

print("Done")

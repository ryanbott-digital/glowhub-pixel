#!/usr/bin/env python3
"""
Fire TV APK Patcher for PWABuilder source ZIPs.

Usage:
  python patch-firetv.py <pwabuilder-source.zip> [tv_banner.png]

Outputs a patched ZIP ready to open in Android Studio and build.
"""

import sys
import os
import zipfile
import shutil
import re
from pathlib import Path

def patch_manifest(xml: str) -> str:
    # 1. Add LEANBACK_LAUNCHER intent filter after existing MAIN/LAUNCHER intent filter
    if "LEANBACK_LAUNCHER" not in xml:
        leanback_filter = '''
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>'''
        # Insert after the closing </intent-filter> of the main launcher
        xml = xml.replace(
            '</intent-filter>\n        </activity>',
            '</intent-filter>' + leanback_filter + '\n        </activity>',
            1
        )
        # Fallback: try without specific whitespace
        if "LEANBACK_LAUNCHER" not in xml:
            xml = re.sub(
                r'(</intent-filter>\s*</activity>)',
                '</intent-filter>' + leanback_filter + '\n        </activity>',
                xml, count=1
            )

    # 2. Add android:banner to <application> tag
    if 'android:banner' not in xml:
        xml = re.sub(
            r'(<application\b)',
            r'\1 android:banner="@drawable/tv_banner"',
            xml, count=1
        )

    # 3. Add uses-feature declarations before <application>
    features = ''
    if 'android.hardware.touchscreen' not in xml:
        features += '    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />\n'
    if 'android.software.leanback' not in xml:
        features += '    <uses-feature android:name="android.software.leanback" android:required="false" />\n'
    if features:
        xml = re.sub(r'(\s*<application\b)', '\n' + features + r'\1', xml, count=1)

    return xml

def main():
    if len(sys.argv) < 2:
        print("Usage: python patch-firetv.py <pwabuilder-source.zip> [tv_banner.png]")
        sys.exit(1)

    src_zip = sys.argv[1]
    banner_path = sys.argv[2] if len(sys.argv) > 2 else None

    if not os.path.exists(src_zip):
        print(f"Error: {src_zip} not found")
        sys.exit(1)

    work_dir = '/tmp/firetv-patch'
    if os.path.exists(work_dir):
        shutil.rmtree(work_dir)
    os.makedirs(work_dir)

    # Extract
    print(f"Extracting {src_zip}...")
    with zipfile.ZipFile(src_zip, 'r') as z:
        z.extractall(work_dir)

    # Find AndroidManifest.xml
    manifest_path = None
    for root, dirs, files in os.walk(work_dir):
        if 'AndroidManifest.xml' in files:
            candidate = os.path.join(root, 'AndroidManifest.xml')
            if 'src/main' in candidate or 'app/src' in candidate:
                manifest_path = candidate
                break
            if not manifest_path:
                manifest_path = candidate

    if not manifest_path:
        print("Error: AndroidManifest.xml not found in ZIP")
        sys.exit(1)

    print(f"Patching {manifest_path}...")
    with open(manifest_path, 'r', encoding='utf-8') as f:
        xml = f.read()

    patched = patch_manifest(xml)
    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write(patched)
    print("✓ Manifest patched")

    # Copy banner image
    if banner_path and os.path.exists(banner_path):
        # Find or create res/drawable directory
        manifest_dir = os.path.dirname(manifest_path)
        res_drawable = os.path.join(manifest_dir, 'res', 'drawable')
        os.makedirs(res_drawable, exist_ok=True)
        dest = os.path.join(res_drawable, 'tv_banner.png')
        shutil.copy2(banner_path, dest)
        print(f"✓ Banner copied to {dest}")
    else:
        print("⚠ No banner image provided - add tv_banner.png to res/drawable manually")

    # Re-zip
    base_name = Path(src_zip).stem
    out_zip = f'/mnt/documents/{base_name}-firetv-patched.zip'
    print(f"Creating {out_zip}...")
    with zipfile.ZipFile(out_zip, 'w', zipfile.ZIP_DEFLATED) as zout:
        for root, dirs, files in os.walk(work_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, work_dir)
                zout.write(file_path, arcname)

    print(f"\n✅ Done! Patched ZIP saved to: {out_zip}")
    print("Next steps:")
    print("  1. Download the patched ZIP")
    print("  2. Open in Android Studio")
    print("  3. Build → Generate Signed APK")
    print("  4. Upload the APK back here to replace public/GlowHub.apk")

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Version update script for openclaw-habitat.
Usage: python scripts/update_version.py [patch|minor|major]
"""
import json
import re
import sys
import os
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def write_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')

def bump_version(current, bump_type):
    parts = list(map(int, current.split('.')))
    if bump_type == 'major':
        parts[0] += 1
        parts[1] = 0
        parts[2] = 0
    elif bump_type == 'minor':
        parts[1] += 1
        parts[2] = 0
    elif bump_type == 'patch':
        parts[2] += 1
    else:
        raise ValueError(f"Unknown bump type: {bump_type}")
    return '.'.join(map(str, parts))

def update_package_json(path, new_version):
    data = read_json(path)
    old = data.get('version', '0.0.0')
    data['version'] = new_version
    write_json(path, data)
    print(f"  {path}: {old} -> {new_version}")

def update_changelog(new_version):
    changelog_path = os.path.join(ROOT, 'CHANGELOG.md')
    if not os.path.exists(changelog_path):
        return
    with open(changelog_path, 'r') as f:
        content = f.read()
    
    today = date.today().isoformat()
    new_entry = f"\n## [{new_version}] - {today}\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n"
    
    # Insert after the header
    marker = "The format is based on [Keep a Changelog](https://keepachangelog.com/)."
    if marker in content:
        content = content.replace(marker, marker + new_entry)
    
    with open(changelog_path, 'w') as f:
        f.write(content)
    print(f"  CHANGELOG.md: added entry for {new_version}")

def update_skill_md(new_version):
    skill_path = os.path.join(ROOT, 'skills', 'habitat', 'SKILL.md')
    if not os.path.exists(skill_path):
        return
    with open(skill_path, 'r') as f:
        content = f.read()
    content = re.sub(r'version: [\d.]+', f'version: {new_version}', content)
    with open(skill_path, 'w') as f:
        f.write(content)
    print(f"  skills/habitat/SKILL.md: updated to {new_version}")

def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('patch', 'minor', 'major'):
        print("Usage: python scripts/update_version.py [patch|minor|major]")
        sys.exit(1)
    
    bump_type = sys.argv[1]
    
    # Read current version from root package.json
    root_pkg = os.path.join(ROOT, 'package.json')
    current = read_json(root_pkg).get('version', '0.0.0')
    new_version = bump_version(current, bump_type)
    
    print(f"Bumping version: {current} -> {new_version} ({bump_type})")
    
    # Update all package.json files
    update_package_json(root_pkg, new_version)
    for pkg in ['shared', 'server', 'client']:
        pkg_path = os.path.join(ROOT, 'packages', pkg, 'package.json')
        if os.path.exists(pkg_path):
            update_package_json(pkg_path, new_version)
    
    # Update CHANGELOG
    update_changelog(new_version)
    
    # Update skill version
    update_skill_md(new_version)
    
    print(f"\nDone! Run: git add -A && git commit -m 'chore: bump to v{new_version}' && git tag v{new_version}")

if __name__ == '__main__':
    main()

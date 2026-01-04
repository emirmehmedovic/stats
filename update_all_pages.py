#!/usr/bin/env python3

import re
import os

# Define all remaining pages to update
files_to_update = [
    "/Users/emir_mw/stats/src/app/operation-types/page.tsx",
    "/Users/emir_mw/stats/src/app/delay-codes/page.tsx",
    "/Users/emir_mw/stats/src/app/airlines/page.tsx",
    "/Users/emir_mw/stats/src/app/comparison/monthly-trend/page.tsx",
    "/Users/emir_mw/stats/src/app/comparison/weekly-trend/page.tsx",
    "/Users/emir_mw/stats/src/app/comparison/page.tsx",
    "/Users/emir_mw/stats/src/app/comparison/yearly-trend/page.tsx",
    "/Users/emir_mw/stats/src/app/analytics/page.tsx",
    "/Users/emir_mw/stats/src/app/employees/new/page.tsx",
    "/Users/emir_mw/stats/src/app/employees/page.tsx",
]

def update_file(file_path):
    """Update a single file with MainLayout and new design system"""

    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False

    with open(file_path, 'r') as f:
        content = f.read()

    original_content = content

    # 1. Add MainLayout import if not already present
    if "import { MainLayout } from '@/components/layout/MainLayout';" not in content:
        # Find last import statement
        import_pattern = r"(import .+ from .+;)\n(?!import)"
        matches = list(re.finditer(import_pattern, content))
        if matches:
            last_import = matches[-1]
            insert_pos = last_import.end()
            content = content[:insert_pos] + "\nimport { MainLayout } from '@/components/layout/MainLayout';" + content[insert_pos:]

    # 2. Replace text colors
    content = re.sub(r'text-slate-900\b', 'text-dark-900', content)
    content = re.sub(r'text-slate-800\b', 'text-dark-900', content)
    content = re.sub(r'text-slate-700\b', 'text-dark-600', content)
    content = re.sub(r'text-slate-600\b', 'text-dark-600', content)
    content = re.sub(r'text-slate-500\b', 'text-dark-500', content)
    content = re.sub(r'text-textMain\b', 'text-dark-900', content)
    content = re.sub(r'text-textMuted\b', 'text-dark-500', content)
    content = re.sub(r'text-textSecondary\b', 'text-dark-600', content)

    # 3. Replace border colors
    content = re.sub(r'border-slate-200\b', 'border-dark-100', content)
    content = re.sub(r'border-slate-100\b', 'border-dark-100', content)
    content = re.sub(r'border-borderSoft\b', 'border-dark-100', content)

    # 4. Replace background colors
    content = re.sub(r'hover:bg-slate-50\b', 'hover:bg-dark-50', content)
    content = re.sub(r'bg-shellBg\b', 'bg-dark-50', content)
    content = re.sub(r'bg-brand-primary\b', 'bg-primary-600', content)
    content = re.sub(r'hover:bg-brand-primary', 'hover:bg-primary-700', content)

    # 5. Replace rounded corners
    content = re.sub(r'rounded-3xl\b', 'rounded-2xl', content)

    # 6. Wrap with MainLayout - handle different return patterns
    # Pattern for: return ( <div className="p-8">
    if '<MainLayout>' not in content:
        # Find the main return statement
        return_pattern = r'(if \(isLoading\) \{\s+return \(\s+)<div className="p-8">'
        content = re.sub(return_pattern, r'\1<MainLayout>\n      <div className="p-8">', content)

        # Add closing tag before final return
        content = re.sub(r'(\s+</div>\s+)\);(\s+\})', r'\1  </MainLayout>\n  );\2', content)

        # Handle if error pattern
        error_pattern = r'(if \(error[^}]+\{\s+return \(\s+)<div className="p-8">'
        content = re.sub(error_pattern, r'\1<MainLayout>\n      <div className="p-8">', content)

        # Handle main return
        main_return_pattern = r'(return \(\s+)<div className="p-8 space-y-6">'
        content = re.sub(main_return_pattern, r'\1<MainLayout>\n    <div className="p-8 space-y-6">', content)

        # Also handle analytics page pattern
        main_return_pattern2 = r'(return \(\s+)<div className="min-h-screen'
        if 'analytics' in file_path:
            content = re.sub(main_return_pattern2, r'\1<MainLayout>\n    <div className="', content)
            content = re.sub(r'min-h-screen bg-gradient-to-br from-slate-50 to-slate-100', '', content)

    # 7. Remove custom headers and breadcrumbs for pages that have them
    # Remove the header section with breadcrumbs
    content = re.sub(
        r'<header className="bg-white border-b[^>]*>.*?</header>\s*',
        '',
        content,
        flags=re.DOTALL
    )

    # Remove max-w-7xl mx-auto wrappers in some contexts
    content = re.sub(r'<div className="max-w-7xl mx-auto space-y-6">', '<div className="space-y-6">', content)
    content = re.sub(r'<div className="max-w-7xl mx-auto">', '<div>', content)
    content = re.sub(r'<main className="max-w-\w+ mx-auto px-8 py-6">', '', content)
    content = re.sub(r'</main>', '', content)

    # Remove min-h-screen bg-shellBg wrapper divs
    content = re.sub(r'<div className="min-h-screen bg-shellBg">', '', content, count=1)

    # Save if changed
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"✓ Updated: {file_path}")
        return True
    else:
        print(f"○ No changes: {file_path}")
        return False

def main():
    print("Starting mass update of pages...")
    print("=" * 60)

    updated_count = 0
    for file_path in files_to_update:
        if update_file(file_path):
            updated_count += 1

    print("=" * 60)
    print(f"Complete! Updated {updated_count}/{len(files_to_update)} files")

if __name__ == "__main__":
    main()

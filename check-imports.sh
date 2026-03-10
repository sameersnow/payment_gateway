#!/bin/bash
# Case-Sensitive Import Checker for Production Builds
# This script verifies all imports match exact file cases

cd "$(dirname "$0")/portal"

echo "🔍 Checking for case-sensitive import issues..."
echo ""

ISSUES_FOUND=0

# Check all TypeScript/TSX files
while IFS= read -r file; do
  # Check for imports from './Something' where file is actually 'something.tsx'
  while IFS=: read -r line_num content; do
    if [ -n "$content" ]; then
      # Extract import path
      import_path=$(echo "$content" | sed -n "s/.*from ['\"]\.\/\([^'\"]*\)['\"].*/\1/p")
      
      if [ -n "$import_path" ]; then
        dir=$(dirname "$file")
        base=$(basename "$import_path")
        
        # Skip if it's a directory import (has index.ts)
        if [ -f "$dir/$import_path/index.ts" ] || [ -f "$dir/$import_path/index.tsx" ]; then
          continue
        fi
        
        # Check if actual file exists with different case
        actual_file=""
        if [ -f "$dir/$import_path.tsx" ]; then
          actual_file="$dir/$import_path.tsx"
        elif [ -f "$dir/$import_path.ts" ]; then
          actual_file="$dir/$import_path.ts"
        fi
        
        if [ -z "$actual_file" ]; then
          # File doesn't exist with this exact case - check for case mismatch
          found_file=$(find "$dir" -maxdepth 1 -iname "$(basename $import_path).tsx" -o -iname "$(basename $import_path).ts" 2>/dev/null | head -1)
          
          if [ -n "$found_file" ]; then
            actual_name=$(basename "$found_file" | sed 's/\.[^.]*$//')
            echo "❌ CASE MISMATCH in $file:$line_num"
            echo "   Import: './$import_path'"
            echo "   Actual: './$actual_name'"
            echo ""
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
          fi
        fi
      fi
    fi
  done < <(grep -n "from ['\"]\./" "$file" 2>/dev/null)
done < <(find src -name "*.ts" -o -name "*.tsx")

echo ""
if [ $ISSUES_FOUND -eq 0 ]; then
  echo "✅ No case-sensitive import issues found!"
  echo "   Build should succeed on Linux production servers."
  exit 0
else
  echo "⚠️  Found $ISSUES_FOUND case-sensitive import issue(s)"
  echo "   These will cause build failures on Linux!"
  exit 1
fi

import re

with open('src/routes/admin.tsx', 'r') as f:
    content = f.read()

# Find and replace the problematic template literals in innerHTML assignments
# These are inside a JSX template string so backticks break syntax

# Pattern 1: resultDiv.innerHTML = `...`
# Replace with: resultDiv.innerHTML = '...'
content = re.sub(
    r"innerHTML = \\`([^`]*?)\\`",
    lambda m: "innerHTML = '" + m.group(1).replace("${", "' + ").replace("}", " + '").replace("\n", " ").replace("  +", " ") + "'",
    content,
    flags=re.DOTALL
)

with open('src/routes/admin.tsx', 'w') as f:
    f.write(content)

print("Fixed template literals!")

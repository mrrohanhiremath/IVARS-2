# Convert Mermaid Diagrams to Images

## Quick Method: Using Mermaid Live Editor (No Installation)

### For Each Diagram:
1. Open https://mermaid.live/
2. Open a diagram file (e.g., `1-system-architecture.md`)
3. Copy the mermaid code between the \`\`\`mermaid and \`\`\` tags
4. Paste into Mermaid Live Editor
5. Click **"Download PNG"** or **"Download SVG"**
6. Save to `diagrams/images/` folder

---

## Automated Method: Using PowerShell Script

### Step 1: Install Node.js
Download from https://nodejs.org/ (if not already installed)

### Step 2: Install Mermaid CLI
```powershell
npm install -g @mermaid-js/mermaid-cli
```

### Step 3: Run the Conversion Script
Save and run the `convert-diagrams.ps1` script in this folder:

```powershell
cd diagrams
.\convert-diagrams.ps1
```

This will create PNG images in `diagrams/images/` folder.

---

## Manual Conversion Using CLI

For individual files:

```powershell
# Single diagram
mmdc -i 1-system-architecture.md -o images/1-system-architecture.png

# With custom settings
mmdc -i 1-system-architecture.md -o images/1-system-architecture.png -w 1920 -H 1080 -b transparent
```

---

## Batch Conversion

To convert all diagrams at once:

```powershell
# Create images folder
mkdir images -Force

# Convert all .md files to PNG
Get-ChildItem *.md -Exclude README.md | ForEach-Object {
    $outputName = $_.BaseName + ".png"
    mmdc -i $_.Name -o "images/$outputName" -w 1920 -b white
}
```

---

## Output

After conversion, you'll have:
- `images/1-system-architecture.png`
- `images/2-database-schema.png`
- `images/3-use-case-diagram.png`
- `images/4-sequence-diagrams.png`
- `images/5-flowcharts.png`
- `images/6-deployment-diagram.png`
- `images/7-component-diagram.png`
- `images/8-data-flow-diagram.png`

---

## Troubleshooting

**Error: "mmdc command not found"**
- Solution: Restart PowerShell after installing mermaid-cli

**Error: "Puppeteer error"**
- Solution: `npm install -g puppeteer`

**Error: "Out of memory"**
- Solution: Use smaller width: `mmdc -i file.md -o file.png -w 1024`

**Complex diagrams not rendering**
- Solution: Use Mermaid Live Editor for manual conversion

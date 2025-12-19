# Generate Workflow Diagram Images

## Option 1: Using Mermaid Live Editor (Easiest)

1. Visit: https://mermaid.live/
2. Copy the Mermaid code from WORKFLOW_DIAGRAM.md
3. Paste it in the editor
4. Click "Download" → Choose PNG, SVG, or PDF
5. Save the image

## Option 2: Using VS Code Extension

1. Install "Markdown Preview Mermaid Support" extension
2. Open WORKFLOW_DIAGRAM.md
3. Press `Ctrl+Shift+V` to preview
4. Right-click on the diagram → "Copy Image" or take screenshot

## Option 3: Using Command Line (mmdc)

Install Mermaid CLI:
```bash
npm install -g @mermaid-js/mermaid-cli
```

Generate images:
```bash
# For the main workflow
mmdc -i workflow-main.mmd -o workflow-main.png -b transparent

# For sequence diagrams
mmdc -i workflow-auth.mmd -o workflow-auth.png -b transparent
mmdc -i workflow-incident.mmd -o workflow-incident.png -b transparent
mmdc -i workflow-management.mmd -o workflow-management.png -b transparent
mmdc -i workflow-analytics.mmd -o workflow-analytics.png -b transparent
```

## Quick Online Generation

I'll create individual .mmd files for easy image generation.

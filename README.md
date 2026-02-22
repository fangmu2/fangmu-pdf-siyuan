# PDF Mindmap

A powerful PDF annotation and mindmap extraction tool that helps you efficiently extract knowledge from PDF documents and organize it into structured notes.

## ✨ Core Features

### 📚 Multi-PDF Project Management
- Create projects to manage multiple PDFs in one place
- Support switching between PDFs within a project
- Persistent data storage

### 📝 Text Excerpt
- Select text in PDF to create annotations with one click
- Support multiple annotation levels: Document Title, H1-H5 headings, Text annotation
- Annotations are automatically saved to SiYuan documents
- Real-time highlight display in PDF

### 📷 Image Excerpt
- Select an area in PDF to capture as an image
- Images are automatically uploaded to SiYuan assets
- Support adding annotation levels and notes
- Display 📷 badge in PDF for image excerpts

### 🎨 Annotation Management
- Real-time display of all excerpted content
- Sort by page number
- Click annotation to quickly locate the corresponding position in PDF
- Support editing annotation content and adding notes
- **Drag to merge**: Drag annotations under headings for organization

### 🗑️ Multiple Delete Methods
- **Delete in PDF**:
  - Hover delete: Hover over highlight marker, click red × button on top-right corner
  - Keyboard delete: Click highlight marker to select (white border, deeper background), press Delete or Backspace key
- **Delete in list**: Click delete button in annotation list
- **Bidirectional sync**: Deleting from PDF or list will synchronously remove the corresponding block in SiYuan

### ⌨️ Quick Operations
- **Click annotation**: Select annotation (highlighted display)
- **Delete/Backspace key**: Delete selected annotation
- **Double-click annotation**: Jump to corresponding position in PDF

## 🚀 How to Use

### 1. Create a Project
Click the "+ New Project" button at the top, enter a project name, and select a PDF file.

### 2. Add PDFs
Continue adding more PDFs to the current project in project management.

### 3. Excerpt Content
- **Text Mode**: Select the "Text" button in the toolbar, then drag to select text in PDF
- **Image Mode**: Select the "Image" button in the toolbar, then drag to select an area in PDF

### 4. Set Level
Before excerpting, you can select the annotation level in the toolbar:
- Document Title: Will become the title of the target document
- H1-H5: Generate headings of corresponding levels
- Text Annotation: Normal text highlight

### 5. Specify Target Document (Optional)
Search and select a SiYuan document in the "Target" input box, annotations will be saved to that document.

### 6. Manage Annotations
- **View**: Annotation list displays all excerpts in real-time
- **Locate**: Double-click annotation item to jump to corresponding position in PDF
- **Edit**: Click edit button to modify annotation content and notes
- **Merge**: Drag annotation under heading for organization
- **Delete**:
  - Hover and click × button in PDF
  - Click to select in PDF, then press Delete key
  - Click delete button in list

## 📖 Use Cases

### Academic Research
- Quickly excerpt key viewpoints when reading papers
- Organize literature structure by heading levels
- Export notes in Markdown format

### Knowledge Organization
- Manage multiple textbooks in one place
- Categorize and annotate important concepts
- Save charts with image screenshots

### Reading Notes
- Highlight and excerpt wonderful passages
- Add personal thoughts and notes
- Generate structured reading notes

## 🎯 Highlights

1. **Non-intrusive Design**: Annotation data is stored in SiYuan document blocks, can be viewed without the plugin
2. **Multi-level Heading Support**: Directly generate H1-H5 headings for easy document structure building
3. **Bidirectional Linking**: Real-time linking between PDF and annotation list for quick positioning
4. **Image Excerpt**: Support screenshot saving of charts, formulas, etc. in PDF
5. **Project-based Management**: Unified management of multiple PDF files, suitable for thematic research
6. **Easy Deletion**: Support deleting annotations directly in PDF with bidirectional sync

## ⚙️ Technical Implementation

- PDF rendering based on PDF.js
- Developed with Vue 3 + TypeScript
- Data stored in SiYuan document block attributes
- Support for SiYuan theme style adaptation
- DOM highlight layer for annotation interaction

## 📌 Notes

1. First-time use requires creating a project and importing a PDF
2. Annotation saving requires a valid target document (if not specified, it will try to save to the most recently edited document)
3. Image excerpts generate PNG files stored in the assets directory
4. It is recommended to regularly check project status through project management
5. Delete operations will synchronously remove the corresponding block in SiYuan, please operate with caution

## 🔄 Changelog

### v0.0.17
- Fixed: `indexOf` error when selecting SiYuan documents in dropdown
- Fixed: Document list not showing after clearing selection
- Improved: Better null/undefined value handling

### v0.0.16
- Removed all debug console.log statements

### v0.0.13
- Added: Hover to show delete button on PDF highlight markers
- Added: Click to select + Delete key to remove annotations in PDF
- Added: 📷 badge for image excerpts in PDF
- Added: Delete confirmation dialog distinguishes between image/text excerpts
- Optimized: Annotation list rendering performance, fixed duplicate display issue
- Fixed: PDF highlight markers not responding to clicks (z-index layer fix)
- Fixed: Bidirectional sync issue for annotation deletion

### v0.0.8
- Added: PDF annotation click selection feature
- Added: Delete key to remove selected annotation
- Optimized: Minimum height for annotation rendering to avoid displaying as lines
- Fixed: Error when annotation color is empty

### v0.0.7
- Added: Multi-PDF project management
- Added: Image excerpt feature
- Added: Annotation level classification
- Optimized: UI interaction experience

## 💬 Feedback

For issues or suggestions, please feedback at [Gitee Issues](https://github.com/fangmu2/fangmu-pdf-siyuan/issues).

## 📄 License

MIT License

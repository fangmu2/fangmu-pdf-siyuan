# Changelog

All notable changes to this project will be documented in this file.

## [0.0.17] - 2026-02-22

### Fixed
- Fixed `indexOf` error when selecting SiYuan documents in dropdown
- Fixed issue where document list doesn't show after clearing selection
- Added proper null/undefined value handling for document search results

### Changed
- Updated plugin metadata for marketplace compatibility
- Improved document list refresh behavior

## [0.0.16] - 2026-02-21

### Changed
- Removed all debug console.log statements from production code
- Kept console.error and console.warn for error reporting

## [0.0.13] - 2026-02-20

### Added
- Hover to show delete button on PDF highlight markers
- Click to select + Delete key to remove annotations in PDF
- 📷 badge for image excerpts in PDF
- Delete confirmation dialog distinguishes between image/text excerpts

### Optimized
- Annotation list rendering performance, fixed duplicate display issue

### Fixed
- PDF highlight markers not responding to clicks (z-index layer fix)
- Bidirectional sync issue for annotation deletion

## [0.0.8] - 2026-02-19

### Added
- PDF annotation click selection feature - click on annotation to select it
- Delete key support - press Delete to remove selected annotation
- Annotation deletion now syncs with SiYuan block removal

### Fixed
- Error when annotation color property is undefined in markdown generator
- Annotation height too small displaying as a line - now ensures minimum height

### Optimized
- Better visual feedback for selected annotations (thicker border, dashed inner border)

## [0.0.7] - 2026-02-18

### Added
- Multi-PDF project management
- Image excerpt feature with area selection
- Annotation level classification (Title, H1-H5, Text)
- Target document selection for saving annotations
- Annotation list with edit and delete functions
- PDF zoom controls

### Changed
- Improved UI/UX design
- Better PDF rendering with PDF.js

## [0.0.1] - 2026-02-15

### Added
- Initial release
- Basic PDF viewing functionality
- Simple plugin framework

# 🎓 Teaching Evaluation Management System

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/techit45/teaching-evaluation-system)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)](README.md)

A comprehensive web-based teaching evaluation system built for educational institutions. Features modern UI/UX, multi-course support, real-time analytics, and Google Sheets integration.

## ✨ Features

### 🏢 **Multi-Course Management**
- Dynamic course creation and management
- Course-specific instructor assignments
- Automated QR code generation for easy access
- Real-time course statistics

### 📊 **Advanced Evaluation System**
- Comprehensive 5-point rating system
- Multiple evaluation categories (Clarity, Preparation, Interaction, Punctuality, Satisfaction)
- Comment and feedback collection
- Duplicate submission prevention

### 📈 **Analytics & Reporting**
- Real-time evaluation statistics
- Visual charts and graphs
- Course performance comparison
- Export capabilities

### 🎨 **Modern User Interface**
- Responsive design (mobile-friendly)
- Dark blue professional theme
- Glassmorphism effects
- Intuitive navigation

### ☁️ **Cloud Integration**
- Google Sheets as database
- Google Apps Script backend
- Real-time data synchronization
- No server maintenance required

## 🚀 Quick Start

### 1. **Setup Google Sheets**

1. Create a new Google Spreadsheet
2. Go to **Extensions** → **Apps Script**
3. Replace the default code with content from `google-apps-script.js`
4. Save and deploy as web app

### 2. **Configure the System**

1. Update `config.js` with your Google Apps Script URL:
```javascript
const SPREADSHEET_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';
```

2. Replace `Logo.png` with your institution's logo

### 3. **Deploy**

Upload all files to your web hosting service or use GitHub Pages:

```bash
# Using GitHub Pages
git clone https://github.com/your-username/teaching-evaluation-system
cd teaching-evaluation-system
# Upload your files and push to GitHub
```

## 📁 Project Structure

```
teaching-evaluation-system/
├── 📄 homepage.html              # Main dashboard
├── 📄 course-management.html     # Course management interface  
├── 📄 student-evaluation.html    # Student evaluation form
├── 📄 evaluation-reports.html    # Analytics and reports
├── 📄 index.html                 # Landing page
├── ⚙️ config.js                  # Configuration file
├── 🖼️ Logo.png                   # Company/Institution logo
├── 🔧 google-apps-script.js      # Backend logic for Google Apps Script
├── 📋 test-api-integration.html  # API testing tool
├── 📂 obsolete-files/            # Archived old files
└── 📚 docs/                      # Documentation files
```

## 🛠️ Core Components

### **Homepage (`homepage.html`)**
- System overview dashboard
- Quick access to all modules
- Real-time system status
- Company branding

### **Course Management (`course-management.html`)**
- Add/delete courses
- Generate QR codes
- Launch evaluations
- Course statistics

### **Student Evaluation (`student-evaluation.html`)**
- Course selection
- Instructor evaluation form
- Rating submission
- Thank you confirmation

### **Evaluation Reports (`evaluation-reports.html`)**
- Comprehensive analytics
- Visual charts and graphs
- Export functionality
- Performance metrics

## 🎯 Usage Guide

### For Administrators:

1. **Setup Courses**: Navigate to Course Management → Add new courses
2. **Generate QR Codes**: Click QR button for each course to share with students
3. **Monitor Progress**: Check Homepage for real-time statistics
4. **View Reports**: Access Evaluation Reports for detailed analytics

### For Students:

1. **Access System**: Scan QR code or visit the evaluation URL
2. **Select Course**: Choose your course from the list
3. **Rate Instructor**: Provide ratings across 5 categories
4. **Submit Feedback**: Add comments and submit evaluation

## 🔧 Configuration

### **Database Configuration (`config.js`)**
```javascript
// Google Apps Script Configuration
const SPREADSHEET_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
const API_URL = SPREADSHEET_URL;

// System Settings
const SYSTEM_NAME = 'Teaching Evaluation Management System';
const COMPANY_NAME = 'Loin-learning';
```

### **Google Apps Script Setup**
1. Copy content from `google-apps-script.js`
2. Paste into Google Apps Script Editor
3. Deploy as web app with execute permissions for "Anyone"
4. Copy the deployment URL to `config.js`

## 📊 Data Structure

The system automatically creates the following Google Sheets:

### **courses**
- Course metadata and configuration
- Status tracking
- Creation/modification timestamps

### **evaluation_[COURSE_CODE]**
- Individual course evaluations
- Rating data (1-5 scale)
- Comments and feedback
- Submission timestamps

### **Instructors_[COURSE_CODE]**
- Course-specific instructor assignments
- Schedule information
- Weekly planning

## 🎨 Customization

### **Branding**
- Replace `Logo.png` with your institution's logo
- Update company name in `config.js`
- Modify colors in CSS variables

### **UI Themes**
The system uses a modern dark blue and white theme with:
- Primary: `#1e40af` (Dark Blue)
- Secondary: `#3b82f6` (Blue)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Orange)
- Error: `#ef4444` (Red)

## 🔐 Security Features

- Input validation and sanitization
- XSS protection
- CORS handling
- Error handling and logging
- Duplicate submission prevention

## 📱 Browser Support

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- 📧 Email: support@loin-learning.com
- 📖 Documentation: See `DEPLOYMENT_GUIDE.md`
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

## 🏆 Acknowledgments

- Built with modern web technologies
- Google Apps Script for backend
- QR Server API for QR code generation
- Font Awesome for icons
- Inter font for typography

---

<div align="center">
  
**🚀 Ready to improve teaching quality with data-driven insights!**

Made with ❤️ by [Loin-learning](https://github.com/Loin-learning)

</div>

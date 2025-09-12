# 🚀 คู่มือการติดตั้งระบบประเมินการสอนออนไลน์
## Production Deployment Guide - Version 3.0.0

### 📋 ข้อกำหนดเบื้องต้น

**ที่จำเป็น:**
- ✅ Google Account (สำหรับ Google Apps Script และ Google Sheets)
- ✅ Web Server หรือ GitHub Pages (สำหรับ host ไฟล์ HTML)
- ✅ Internet Connection

**แนะนำ:**
- 🌐 Custom Domain Name
- 🔒 SSL Certificate (HTTPS)
- 📊 Google Analytics (optional)

---

## 📖 ขั้นตอนการติดตั้ง

### 🔧 ขั้นตอนที่ 1: ติดตั้ง Google Apps Script Backend

1. **เปิด Google Apps Script**
   - ไปที่ [script.google.com](https://script.google.com)
   - คลิก "โปรเจคใหม่" (New Project)

2. **สร้างโปรเจค**
   ```
   ชื่อโปรเจค: "Teaching Evaluation System API"
   ```

3. **คัดลอกโค้ด Backend**
   - เปิดไฟล์ `google-apps-script.js`
   - คัดลอกโค้ดทั้งหมด
   - แทนที่ใน Google Apps Script Editor

4. **บันทึกโปรเจค**
   - กด Ctrl+S หรือ Cmd+S
   - ตั้งชื่อ: `Teaching Evaluation API`

5. **Deploy as Web App**
   ```
   1. คลิก "Deploy" > "New deployment"
   2. Type: "Web app"
   3. Description: "Teaching Evaluation System API v3.0"
   4. Execute as: "Me"
   5. Who has access: "Anyone"
   6. คลิก "Deploy"
   ```

6. **คัดลอก Web App URL**
   ```
   URL จะมีหน้าตาแบบนี้:
   https://script.google.com/macros/s/[SCRIPT_ID]/exec
   
   ⚠️ เก็บ URL นี้ไว้ - จำเป็นสำหรับขั้นตอนถัดไป
   ```

### 📊 ขั้นตอนที่ 2: สร้าง Google Sheets Database

1. **สร้าง Google Sheets ใหม่**
   - ไปที่ [sheets.google.com](https://sheets.google.com)
   - คลิก "เอกสารเปล่า"
   - ตั้งชื่อ: "Teaching Evaluation Database"

2. **คัดลอก Spreadsheet URL**
   ```
   URL จะมีหน้าตาแบบนี้:
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   
   ⚠️ เก็บ URL นี้ไว้สำหรับใส่ในระบบ
   ```

3. **ให้สิทธิ์ Scripts เข้าถึง**
   - แชร์ Google Sheets
   - ให้สิทธิ์ "Editor" กับ Google Account เดียวกับที่ใช้สร้าง Script

### 💻 ขั้นตอนที่ 3: อัปเดตการกำหนดค่า Frontend

1. **แก้ไขไฟล์ config.js**
   ```javascript
   // เปลี่ยน API_URL ใหม่
   API_URL: 'YOUR_WEB_APP_URL_HERE',
   
   // เปลี่ยน SPREADSHEET_URL ใหม่
   SPREADSHEET_URL: 'YOUR_SPREADSHEET_URL_HERE',
   
   // เปลี่ยนเป็น production mode
   ENVIRONMENT: 'production',
   DEBUG: false
   ```

2. **ตรวจสอบการเชื่อมต่อ**
   - เปิดไฟล์ `test-api-integration.html` ในเบราว์เซอร์
   - คลิก "Test Health Check"
   - ต้องแสดงผล "เชื่อมต่อสำเร็จ"

### 🌐 ขั้นตอนที่ 4: Deploy Frontend

#### ตัวเลือกที่ 1: GitHub Pages (ฟรี)

1. **สร้าง GitHub Repository**
   ```bash
   1. ไปที่ github.com
   2. คลิก "New repository"
   3. ตั้งชื่อ: "teaching-evaluation-system"
   4. เลือก "Public"
   5. คลิก "Create repository"
   ```

2. **อัปโหลดไฟล์**
   ```bash
   # หากใช้ Git command line
   git init
   git add .
   git commit -m "Initial deployment"
   git branch -M main
   git remote add origin https://github.com/USERNAME/teaching-evaluation-system.git
   git push -u origin main
   ```

3. **เปิดใช้งาน Pages**
   ```
   1. Settings > Pages
   2. Source: Deploy from a branch
   3. Branch: main
   4. Folder: / (root)
   5. คลิก Save
   ```

4. **เข้าถึงเว็บไซต์**
   ```
   URL: https://USERNAME.github.io/teaching-evaluation-system
   ```

#### ตัวเลือกที่ 2: Web Hosting

1. **อัปโหลดไฟล์ไป Web Server**
   - อัปโหลดไฟล์ HTML, CSS, JS ทั้งหมด
   - ตรวจสอบให้ `index.html` อยู่ในโฟลเดอร์หลัก

2. **ตั้งค่า HTTPS (แนะนำ)**
   - ใช้ Let's Encrypt หรือ SSL Certificate ของ hosting provider

---

## ✅ การทดสอบระบบ

### 🔍 ทดสอบ API Connection

1. **เปิด Test Page**
   - ไปที่ `test-api-integration.html`
   - รันการทดสอบทั้งหมด

2. **ผลลัพธ์ที่คาดหวัง**
   ```
   ✅ Health Check: เชื่อมต่อสำเร็จ
   ✅ Get Courses: ดึงข้อมูลสำเร็จ
   ✅ Create Course: สร้างหลักสูตรทดสอบสำเร็จ
   ✅ Get Instructors: ดึงข้อมูลผู้สอนสำเร็จ
   ✅ Submit Evaluation: ส่งการประเมินสำเร็จ
   ```

### 👨‍💼 ทดสอบ Admin Workflow

1. **การจัดการหลักสูตร**
   ```
   1. ไปที่หน้าหลัก
   2. คลิก "จัดการหลักสูตร"
   3. เพิ่มหลักสูตรทดสอบ
   4. แก้ไขหลักสูตร
   5. ลบหลักสูตร
   ```

2. **ตรวจสอบ Google Sheets**
   - ดูใน Google Sheets ว่าข้อมูลถูกเพิ่มเข้าไปถูกต้อง
   - ตรวจสอบ Sheets ใหม่ถูกสร้างสำหรับแต่ละหลักสูตร

### 🎓 ทดสอบ Student Workflow

1. **การประเมินการสอน**
   ```
   1. ไปที่หน้าหลัก
   2. คลิก "ประเมินการสอน"
   3. เลือกหลักสูตร
   4. กรอกแบบประเมิน
   5. ส่งการประเมิน
   ```

2. **ตรวจสอบข้อมูลการประเมิน**
   - ดูใน Google Sheets ว่าการประเมินถูกบันทึก
   - ตรวจสอบ formatting และสีสัน

---

## ⚙️ การกำหนดค่าขั้นสูง

### 🔒 Security Settings

1. **Google Apps Script**
   ```
   1. เปิด Apps Script project
   2. ไปที่ Settings
   3. เปิด "Show "appsscript.json" manifest file"
   4. เพิ่ม permissions ที่จำเป็น
   ```

2. **Google Sheets Permissions**
   ```
   1. แชร์ Google Sheets กับ Script Service Account
   2. ให้สิทธิ์ Editor เท่านั้น
   3. ไม่แชร์กับ public
   ```

### 📊 Analytics Setup (Optional)

1. **เพิ่ม Google Analytics**
   ```html
   <!-- เพิ่มใน <head> ของทุกไฟล์ HTML -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_MEASUREMENT_ID');
   </script>
   ```

### 🎨 Customization

1. **เปลี่ยนสีธีม**
   - แก้ไข `config.js` ใน section `COLORS`
   - อัปเดต CSS variables

2. **เปลี่ยนโลโก้**
   - เพิ่มไฟล์โลโก้ใน folder
   - อัปเดต HTML เพื่อแสดงโลโก้

---

## 🐛 การแก้ไขปัญหา

### ❌ ปัญหาที่พบบ่อย

1. **"ไม่สามารถเชื่อมต่อได้"**
   ```
   ✅ ตรวจสอบ API_URL ใน config.js
   ✅ ตรวจสอบ Google Apps Script ได้ Deploy แล้ว
   ✅ ตรวจสอบสิทธิ์เข้าถึง "Anyone"
   ```

2. **"Permission denied"**
   ```
   ✅ ตรวจสอบสิทธิ์ Google Sheets
   ✅ Re-deploy Google Apps Script
   ✅ อนุญาตให้ Script เข้าถึง Google Sheets
   ```

3. **"Course creation failed"**
   ```
   ✅ ตรวจสอบ Google Sheets มีอยู่จริง
   ✅ ตรวจสอบ Internet connection
   ✅ ดู Google Apps Script execution transcript
   ```

### 🔧 Debug Mode

1. **เปิด Debug Mode**
   ```javascript
   // ใน config.js
   DEBUG: true
   ```

2. **ดู Console Logs**
   ```
   F12 > Console tab
   ดู error messages และ API responses
   ```

---

## 🔄 การอัปเดต

### 📤 อัปเดต Backend

1. **Google Apps Script**
   ```
   1. แก้ไขโค้ดใน Apps Script Editor
   2. บันทึก (Ctrl+S)
   3. Deploy > New deployment
   4. เลือก version ใหม่
   ```

### 📥 อัปเดต Frontend

1. **GitHub Pages**
   ```bash
   git add .
   git commit -m "Update version X.X.X"
   git push origin main
   ```

2. **Web Hosting**
   - อัปโหลดไฟล์ใหม่ทับของเก่า
   - Clear browser cache

---

## 📞 การสนับสนุน

### 🆘 หากมีปัญหา

1. **ตรวจสอบ Logs**
   - Google Apps Script > Executions
   - Browser Console (F12)

2. **ติดต่อสนับสนุน**
   - Email: support@yourschool.ac.th
   - Line: @yourschool
   - GitHub Issues

### 📚 เอกสารเพิ่มเติม

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets API Reference](https://developers.google.com/sheets/api)
- [GitHub Pages Guide](https://pages.github.com)

---

**🎉 ขอให้การใช้งานเป็นไปด้วยดี!**

*Version 3.0.0 - Production Ready*  
*Last Updated: September 11, 2025*
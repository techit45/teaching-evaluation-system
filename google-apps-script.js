// 🔧 Google Apps Script Code - ระบบประเมินการสอนหลายหลักสูตร
// Version: 3.0.0 - Multi-Course Support
// Updated: 2025 - Enhanced evaluation system with multiple courses
// วิธีใช้: แทนที่โค้ดทั้งหมดใน Google Apps Script Editor

// =============================================================================
// 📋 MAIN HANDLERS - จัดการ HTTP Requests
// =============================================================================

function doGet(e) {
  try {
    console.log('=== doGet called ===');
    console.log('Parameters:', e ? e.parameter : 'No event object');
    
    // Add CORS headers for cross-origin requests
    const response = handleRequest('GET', e);
    return response;
    
  } catch (error) {
    console.error('Error in doGet:', error);
    return createErrorResponse('GET request failed: ' + error.toString());
  }
}

function handleRequest(method, e) {
  try {
    // Health check endpoint (works without parameters)
    if (!e || !e.parameter || e.parameter.action === 'health') {
      return createHealthResponse();
    }
    
    const action = e.parameter.action;
    console.log('Action requested:', action);
    
    // Get instructors data
    if (action === 'getInstructors') {
      return getInstructors();
    }

    // Get courses data
    if (action === 'getCourses') {
      return getCourses();
    }

    // Get evaluations data
    if (action === 'getEvaluations') {
      const courseId = e.parameter.courseId;
      return getEvaluations(courseId);
    }

    // Get evaluation statistics
    if (action === 'getStats') {
      const courseId = e.parameter.courseId;
      return getEvaluationStatistics(courseId);
    }
    
    // Default response for GET requests
    return createSuccessResponse({
      message: 'GET request received successfully',
      availableActions: ['health', 'getInstructors', 'getCourses', 'getEvaluations', 'getStats'],
      timestamp: new Date().toISOString(),
      version: '3.0.0',
      method: method,
      receivedAction: action
    });
    
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return createErrorResponse('Request handling failed: ' + error.toString());
  }
}

function doPost(e) {
  try {
    console.log('=== doPost called ===');
    console.log('Event object:', e);
    
    if (!e) {
      return createErrorResponse('No event object received');
    }
    
    // Handle both JSON and form data
    let requestData;
    if (e.postData) {
      try {
        requestData = JSON.parse(e.postData.contents);
        console.log('POST data received (JSON):', requestData);
      } catch (parseError) {
        console.log('JSON parse failed, trying form data:', parseError);
        // Try to handle as form data or plain text
        requestData = { 
          action: e.postData.contents || 'unknown',
          raw: e.postData.contents 
        };
      }
    } else if (e.parameter) {
      // Handle as URL parameters in POST
      requestData = { action: e.parameter.action };
      console.log('POST data received (parameters):', requestData);
    } else {
      return createErrorResponse('No POST data or parameters received');
    }
    
    const action = requestData.action;
    console.log('Processing action:', action);
    
    // Health check
    if (action === 'health') {
      return createHealthResponse();
    }
    
    // Submit evaluation
    if (action === 'submitEvaluation') {
      if (!requestData.data) {
        return createErrorResponse('No evaluation data provided');
      }
      return submitEvaluation(requestData.data);
    }

    // Course management actions
    if (action === 'getCourses') {
      return getCourses();
    }
    
    // Get evaluation statistics
    if (action === 'getEvaluationStats') {
      const courseId = requestData.courseId;
      const startDate = requestData.startDate;
      const endDate = requestData.endDate;
      return getEvaluationStatistics(courseId, startDate, endDate);
    }
    
    if (action === 'createCourse') {
      if (!requestData.data) {
        return createErrorResponse('No course data provided');
      }
      return createCourse(requestData.data);
    }

    if (action === 'updateCourse') {
      if (!requestData.data) {
        return createErrorResponse('No course data provided');
      }
      return updateCourse(requestData.data);
    }

    if (action === 'deleteCourse') {
      if (!requestData.data || !requestData.data.courseId) {
        return createErrorResponse('No course ID provided');
      }
      return deleteCourse(requestData.data.courseId);
    }

    // Beautify sheets action
    if (action === 'beautifySheets') {
      return beautifyAllSheets();
    }
    
    // Update instructor data
    if (action === 'updateInstructor') {
      if (!requestData.data) {
        return createErrorResponse('No instructor data provided');
      }
      return updateInstructor(requestData.data);
    }
    
    return createErrorResponse('Unknown action: ' + (action || 'undefined'));
    
  } catch (error) {
    console.error('Error in doPost:', error);
    return createErrorResponse('POST request failed: ' + error.toString() + ' | Stack: ' + (error.stack || 'No stack'));
  }
}

// =============================================================================
// 📊 COURSE MANAGEMENT FUNCTIONS
// =============================================================================

function getCourses() {
  try {
    console.log('=== getCourses called ===');
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let coursesSheet = spreadsheet.getSheetByName('courses');
    
    // Create courses sheet if it doesn't exist
    if (!coursesSheet) {
      coursesSheet = spreadsheet.insertSheet('courses');
      setupCoursesSheet(coursesSheet);
      
      // Add sample courses immediately
      const sampleCourses = [
        ['1', 'PS001', 'Power Supply', 'electronics', 16, 'หลักสูตรการออกแบบและซ่อมบำรุงแหล่งจ่ายไฟ', 'active', new Date().toISOString(), new Date().toISOString()],
        ['2', 'ARD001', 'Arduino Programming', 'programming', 20, 'หลักสูตรการเขียนโปรแกรมและควบคุมด้วย Arduino', 'active', new Date().toISOString(), new Date().toISOString()],
        ['3', 'EL001', 'Basic Electronics', 'electronics', 24, 'หลักสูตรพื้นฐานอิเล็กทรอนิกส์', 'active', new Date().toISOString(), new Date().toISOString()]
      ];
      
      sampleCourses.forEach(course => {
        coursesSheet.appendRow(course);
      });
    }
    
    const range = coursesSheet.getDataRange();
    if (range.getNumRows() <= 1) {
      // Return empty array if no courses
      return createSuccessResponse({
        courses: [],
        count: 0
      });
    }
    
    const values = range.getValues();
    const headers = values[0];
    const courses = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const course = {};
      
      headers.forEach((header, index) => {
        course[header] = row[index];
      });
      
      courses.push(course);
    }
    
    return createSuccessResponse({
      courses: courses,
      count: courses.length
    });
    
  } catch (error) {
    console.error('Error in getCourses:', error);
    return createErrorResponse('Failed to get courses: ' + error.toString());
  }
}

function createCourse(courseData) {
  try {
    console.log('=== createCourse called ===', courseData);
    
    // Enhanced validation
    const validationResult = validateCourseData(courseData);
    if (!validationResult.isValid) {
      return createErrorResponse(validationResult.errors.join(', '));
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let coursesSheet = spreadsheet.getSheetByName('courses');
    
    // Create courses sheet if it doesn't exist
    if (!coursesSheet) {
      coursesSheet = spreadsheet.insertSheet('courses');
      setupCoursesSheet(coursesSheet);
    }
    
    // Check for duplicate course code
    const existingCourses = coursesSheet.getDataRange().getValues();
    for (let i = 1; i < existingCourses.length; i++) {
      if (existingCourses[i][1] && existingCourses[i][1].toString().toLowerCase() === courseData.code.toLowerCase()) {
        return createErrorResponse('Course code already exists');
      }
    }
    
    // Add new course
    const newRow = [
      courseData.id || Date.now().toString(),
      courseData.code,
      courseData.name,
      courseData.category || '',
      courseData.duration || 0,
      courseData.description || '',
      courseData.status || 'active',
      new Date().toISOString(),
      new Date().toISOString()
    ];
    
    coursesSheet.appendRow(newRow);
    
    // Force flush to ensure data is committed immediately
    SpreadsheetApp.flush();
    console.log('Course data written to courses sheet and flushed:', newRow);
    
    // Verify the course was actually saved by reading back
    const verifyRange = coursesSheet.getDataRange();
    const verifyValues = verifyRange.getValues();
    let courseFound = false;
    for (let i = 1; i < verifyValues.length; i++) {
      if (verifyValues[i][1] === courseData.code) {
        courseFound = true;
        console.log('Verification: Course found in sheet at row', i + 1, ':', verifyValues[i]);
        break;
      }
    }
    
    if (!courseFound) {
      console.error('Warning: Course not found in sheet after insertion!');
    }
    
    // สร้าง sheets สำหรับคอร์สใหม่โดยอัตโนมัติ
    const courseCode = courseData.code;
    createCourseSheets(spreadsheet, courseCode);
    
    return createSuccessResponse({
      message: 'Course created successfully',
      courseId: newRow[0],
      courseCode: courseCode,
      sheetsCreated: [`Instructors_${courseCode}`, `evaluations_${courseCode}`],
      verified: courseFound
    });
    
  } catch (error) {
    console.error('Error in createCourse:', error);
    return createErrorResponse('Failed to create course: ' + error.toString());
  }
}

// สร้าง sheets สำหรับคอร์สใหม่
function createCourseSheets(spreadsheet, courseCode) {
  try {
    console.log('=== createCourseSheets called ===', courseCode);
    
    // สร้าง Instructors sheet สำหรับคอร์สนี้
    const instructorSheetName = `Instructors_${courseCode}`;
    let instructorSheet = spreadsheet.getSheetByName(instructorSheetName);
    
    if (!instructorSheet) {
      instructorSheet = spreadsheet.insertSheet(instructorSheetName);
      setupInstructorsSheet(instructorSheet);
      createSampleInstructorData(instructorSheet);
      console.log(`Created ${instructorSheetName} sheet`);
    }
    
    // สร้าง evaluation sheet สำหรับคอร์สนี้ - ใช้ 'evaluations_' (with s)
    const evaluationSheetName = `evaluations_${courseCode}`;
    let evaluationSheet = spreadsheet.getSheetByName(evaluationSheetName);
    
    if (!evaluationSheet) {
      evaluationSheet = spreadsheet.insertSheet(evaluationSheetName);
      setupEvaluationSheet(evaluationSheet);
      console.log(`Created ${evaluationSheetName} sheet`);
    }
    
    return true;
  } catch (error) {
    console.error('Error creating course sheets:', error);
    return false;
  }
}

// สร้าง sheets ให้คอร์สที่มีอยู่แล้วทั้งหมด (ใช้ผ่าน Google Sheets menu)
function createSheetsForAllCourses() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const coursesSheet = spreadsheet.getSheetByName('courses');
    
    if (!coursesSheet) {
      return 'ไม่พบ sheet courses';
    }
    
    const values = coursesSheet.getDataRange().getValues();
    let created = [];
    
    for (let i = 1; i < values.length; i++) {
      const courseCode = values[i][1]; // คอลัมน์ course code
      if (courseCode) {
        const result = createCourseSheets(spreadsheet, courseCode);
        if (result) {
          created.push(courseCode);
        }
      }
    }
    
    const ui = SpreadsheetApp.getUi();
    ui.alert('สร้าง Sheets สำเร็จ', 
      `สร้าง sheets สำหรับคอร์ส: ${created.join(', ')}`, 
      ui.ButtonSet.OK);
    
  } catch (error) {
    const ui = SpreadsheetApp.getUi();
    ui.alert('เกิดข้อผิดพลาด', error.toString(), ui.ButtonSet.OK);
  }
}

function updateCourse(courseData) {
  try {
    console.log('=== updateCourse called ===', courseData);
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const coursesSheet = spreadsheet.getSheetByName('courses');
    
    if (!coursesSheet) {
      return createErrorResponse('Courses sheet not found');
    }
    
    const range = coursesSheet.getDataRange();
    const values = range.getValues();
    
    // Find the course to update (search by originalCode if provided)
    let rowIndex = -1;
    const searchCode = courseData.originalCode || courseData.code;
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === courseData.id || values[i][1] === searchCode) {
        rowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }
    
    if (rowIndex === -1) {
      return createErrorResponse('Course not found');
    }
    
    const oldCourseCode = values[rowIndex - 1][1];
    const newCourseCode = courseData.code;
    
    // Update the course
    const updatedRow = [
      courseData.id,
      courseData.code,
      courseData.name,
      courseData.category || '',
      courseData.duration || 0,
      courseData.description || '',
      courseData.status || 'active',
      values[rowIndex - 1][7], // Keep original created date
      new Date().toISOString() // Update modified date
    ];
    
    coursesSheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
    
    // If course code changed, rename associated sheets
    if (oldCourseCode !== newCourseCode) {
      console.log(`Course code changed from ${oldCourseCode} to ${newCourseCode}, renaming sheets...`);
      
      // Rename instructor sheet
      const oldInstructorSheet = spreadsheet.getSheetByName(`Instructors_${oldCourseCode}`);
      if (oldInstructorSheet) {
        oldInstructorSheet.setName(`Instructors_${newCourseCode}`);
        console.log(`Renamed Instructors_${oldCourseCode} to Instructors_${newCourseCode}`);
      }
      
      // Rename evaluation sheet
      let oldEvaluationSheet = spreadsheet.getSheetByName(`evaluations_${oldCourseCode}`);
      if (oldEvaluationSheet) {
        oldEvaluationSheet.setName(`evaluations_${newCourseCode}`);
        console.log(`Renamed evaluations_${oldCourseCode} to evaluations_${newCourseCode}`);
      }
    }
    
    return createSuccessResponse({
      message: 'Course updated successfully',
      courseId: courseData.id,
      sheetsRenamed: oldCourseCode !== newCourseCode
    });
    
  } catch (error) {
    console.error('Error in updateCourse:', error);
    return createErrorResponse('Failed to update course: ' + error.toString());
  }
}

function deleteCourse(courseId) {
  try {
    console.log('=== deleteCourse called ===', courseId);
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const coursesSheet = spreadsheet.getSheetByName('courses');
    
    if (!coursesSheet) {
      return createErrorResponse('Courses sheet not found');
    }
    
    const range = coursesSheet.getDataRange();
    const values = range.getValues();
    
    // Find the course to delete
    let rowIndex = -1;
    let courseCode = null;
    
    console.log('Looking for courseId:', courseId, 'Type:', typeof courseId);
    
    for (let i = 1; i < values.length; i++) {
      const sheetId = String(values[i][0] || '').trim();
      const sheetCode = String(values[i][1] || '').trim();
      const searchId = String(courseId || '').trim();
      
      if (sheetId === searchId || sheetCode === searchId) {
        rowIndex = i + 1;
        courseCode = values[i][1];
        console.log(`Found matching course: ID=${sheetId}, Code=${sheetCode} at row ${rowIndex}`);
        break;
      }
    }
    
    if (rowIndex === -1) {
      return createErrorResponse(`Course not found. Searched for: "${courseId}"`);
    }
    
    console.log(`Found course to delete: ${courseCode} at row ${rowIndex}`);
    
    // Delete associated sheets first
    const sheetsDeleted = [];
    
    // Delete instructor sheet
    const instructorSheet = spreadsheet.getSheetByName(`Instructors_${courseCode}`);
    if (instructorSheet) {
      spreadsheet.deleteSheet(instructorSheet);
      sheetsDeleted.push(`Instructors_${courseCode}`);
      console.log(`Deleted sheet: Instructors_${courseCode}`);
    }
    
    // Delete evaluation sheet
    const evaluationSheet = spreadsheet.getSheetByName(`evaluations_${courseCode}`);
    if (evaluationSheet) {
      spreadsheet.deleteSheet(evaluationSheet);
      sheetsDeleted.push(`evaluations_${courseCode}`);
      console.log(`Deleted sheet: evaluations_${courseCode}`);
    }
    
    // Delete the course row
    coursesSheet.deleteRow(rowIndex);
    
    return createSuccessResponse({
      message: 'Course deleted successfully',
      courseCode: courseCode,
      sheetsDeleted: sheetsDeleted
    });
    
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    return createErrorResponse('Failed to delete course: ' + error.toString());
  }
}

function setupCoursesSheet(sheet) {
  const headers = [
    'id', 'code', 'name', 'category', 'duration', 
    'description', 'status', 'created_at', 'updated_at'
  ];
  
  sheet.appendRow(headers);
  
  // Enhanced header formatting
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4f46e5')
            .setFontColor('#ffffff')
            .setFontWeight('bold')
            .setFontSize(12)
            .setHorizontalAlignment('center')
            .setVerticalAlignment('middle');
  
  // Add borders to header
  headerRange.setBorder(true, true, true, true, true, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // Set specific column widths
  sheet.setColumnWidth(1, 80);   // id
  sheet.setColumnWidth(2, 120);  // code
  sheet.setColumnWidth(3, 300);  // name
  sheet.setColumnWidth(4, 120);  // category
  sheet.setColumnWidth(5, 100);  // duration
  sheet.setColumnWidth(6, 400);  // description
  sheet.setColumnWidth(7, 80);   // status
  sheet.setColumnWidth(8, 150);  // created_at
  sheet.setColumnWidth(9, 150);  // updated_at
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

// =============================================================================
// 📝 EVALUATION FUNCTIONS - Enhanced for Multiple Courses
// =============================================================================

function validateEvaluationData(evaluationData) {
  const errors = [];
  
  // Required fields validation
  const requiredFields = {
    'course': 'Course information',
    'center': 'Study center',
    'week': 'Week number',
    'day': 'Day',
    'period': 'Time period',
    'instructor': 'Instructor name',
    'ratings': 'Ratings data'
  };
  
  for (let [field, description] of Object.entries(requiredFields)) {
    if (!evaluationData[field] || evaluationData[field] === '') {
      errors.push(`${description} is required`);
    }
  }
  
  // Course object validation
  if (evaluationData.course) {
    if (!evaluationData.course.code || evaluationData.course.code.trim() === '') {
      errors.push('Course code is required');
    }
    if (!evaluationData.course.name || evaluationData.course.name.trim() === '') {
      errors.push('Course name is required');
    }
  }
  
  // Week validation (should be 1-52)
  if (evaluationData.week) {
    const week = parseInt(evaluationData.week);
    if (isNaN(week) || week < 1 || week > 52) {
      errors.push('Week must be a number between 1-52');
    }
  }
  
  // Day validation
  if (evaluationData.day) {
    const validDays = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    if (!validDays.includes(evaluationData.day)) {
      errors.push('Invalid day. Must be a valid day of week in Thai');
    }
  }
  
  // Period validation
  if (evaluationData.period) {
    const validPeriods = ['08:00-12:00', '13:00-17:00', 'เช้า', 'บ่าย'];
    if (!validPeriods.includes(evaluationData.period)) {
      errors.push('Invalid time period. Must be one of: ' + validPeriods.join(', '));
    }
  }
  
  // Instructor name validation
  if (evaluationData.instructor) {
    const instructor = evaluationData.instructor.trim();
    if (instructor.length < 2) {
      errors.push('Instructor name must be at least 2 characters');
    }
    if (instructor.length > 100) {
      errors.push('Instructor name must not exceed 100 characters');
    }
  }
  
  // Comments validation
  if (evaluationData.comments && evaluationData.comments.length > 1000) {
    errors.push('Comments must not exceed 1000 characters');
  }
  
  // Ratings validation
  if (evaluationData.ratings) {
    const requiredRatings = ['clarity', 'preparation', 'interaction', 'punctuality', 'satisfaction'];
    
    for (let rating of requiredRatings) {
      if (!evaluationData.ratings[rating]) {
        errors.push(`Rating for ${rating} is required`);
      } else {
        const ratingValue = parseFloat(evaluationData.ratings[rating]);
        if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
          errors.push(`Rating for ${rating} must be between 1-5`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function validateCourseData(courseData) {
  const errors = [];
  
  // Required fields
  if (!courseData.code || courseData.code.trim() === '') {
    errors.push('Course code is required');
  } else {
    const codeRegex = /^[A-Za-z0-9]{2,10}$/;
    if (!codeRegex.test(courseData.code.trim())) {
      errors.push('Course code must be 2-10 characters, letters and numbers only');
    }
  }
  
  if (!courseData.name || courseData.name.trim() === '') {
    errors.push('Course name is required');
  } else {
    if (courseData.name.trim().length < 3) {
      errors.push('Course name must be at least 3 characters');
    }
    if (courseData.name.trim().length > 200) {
      errors.push('Course name must not exceed 200 characters');
    }
  }
  
  // Optional field validations
  if (courseData.duration) {
    const duration = parseInt(courseData.duration);
    if (isNaN(duration) || duration < 1 || duration > 1000) {
      errors.push('Duration must be between 1-1000 hours');
    }
  }
  
  if (courseData.description && courseData.description.length > 1000) {
    errors.push('Description must not exceed 1000 characters');
  }
  
  if (courseData.category) {
    const validCategories = ['junior', 'senior'];
    if (!validCategories.includes(courseData.category)) {
      errors.push('Invalid category. Must be one of: ' + validCategories.join(', '));
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

function submitEvaluation(evaluationData) {
  try {
    console.log('=== submitEvaluation called ===', evaluationData);
    
    // Enhanced validation
    const validationResult = validateEvaluationData(evaluationData);
    if (!validationResult.isValid) {
      return createErrorResponse(validationResult.errors.join(', '));
    }
    
    // Validate ratings
    const ratings = evaluationData.ratings;
    const requiredRatings = ['clarity', 'preparation', 'interaction', 'punctuality', 'satisfaction'];
    
    for (let rating of requiredRatings) {
      if (!ratings[rating] || ratings[rating] < 1 || ratings[rating] > 5) {
        return createErrorResponse(`Invalid rating for ${rating}. Must be between 1-5`);
      }
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create evaluation sheet for the course if it doesn't exist - use 'evaluations_' with s
    const courseId = evaluationData.course.id || evaluationData.course.code;
    const sheetName = `evaluations_${courseId}`;
    let evaluationSheet = spreadsheet.getSheetByName(sheetName);
    
    if (!evaluationSheet) {
      evaluationSheet = spreadsheet.insertSheet(sheetName);
      setupEvaluationSheet(evaluationSheet);
    }
    
    // Check for duplicate submission
    const existingData = evaluationSheet.getDataRange().getValues();
    const duplicateCheck = `${evaluationData.center}_${evaluationData.week}_${evaluationData.day}_${evaluationData.period}`;
    
    for (let i = 1; i < existingData.length; i++) {
      const existingCheck = `${existingData[i][2]}_${existingData[i][3]}_${existingData[i][4]}_${existingData[i][5]}`;
      if (existingCheck === duplicateCheck) {
        return createErrorResponse('คุณได้ประเมินในช่วงเวลานี้แล้ว กรุณาเลือกช่วงเวลาอื่น');
      }
    }
    
    // Prepare evaluation data row
    const evaluationId = Date.now().toString();
    const timestamp = new Date().toISOString();
    
    const newRow = [
      evaluationId,
      evaluationData.course.code,
      evaluationData.center,
      evaluationData.week,
      evaluationData.day,
      evaluationData.period,
      evaluationData.instructor,
      ratings.clarity,
      ratings.preparation,
      ratings.interaction,
      ratings.punctuality,
      ratings.satisfaction,
      evaluationData.comments || evaluationData.comment || '',
      timestamp,
      evaluationData.course.name || '',
      evaluationData.course.category || ''
    ];
    
    console.log('Appending row to sheet:', sheetName);
    console.log('Row data:', newRow);
    
    evaluationSheet.appendRow(newRow);
    
    // Apply formatting to the new row
    const lastRow = evaluationSheet.getLastRow();
    formatEvaluationRow(evaluationSheet, lastRow);
    
    // Auto-beautify the sheet after adding new data
    try {
      beautifyEvaluationSheet(evaluationSheet);
    } catch (beautifyError) {
      console.log('Warning: Could not beautify sheet:', beautifyError);
    }
    
    console.log('Evaluation saved successfully to row:', lastRow);
    
    return createSuccessResponse({
      message: 'การประเมินสำเร็จ! ขอบคุณสำหรับความคิดเห็น',
      evaluationId: evaluationId,
      course: evaluationData.course.name,
      sheet: sheetName,
      row: lastRow
    });
    
  } catch (error) {
    console.error('Error in submitEvaluation:', error);
    return createErrorResponse('เกิดข้อผิดพลาดในการบันทึกการประเมิน: ' + error.toString());
  }
}

function getEvaluations(courseId) {
  try {
    console.log('=== getEvaluations called ===', courseId);
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = courseId ? `evaluations_${courseId}` : 'evaluations';
    const evaluationSheet = spreadsheet.getSheetByName(sheetName);
    
    if (!evaluationSheet) {
      return createSuccessResponse({
        evaluations: [],
        count: 0
      });
    }
    
    const range = evaluationSheet.getDataRange();
    if (range.getNumRows() <= 1) {
      return createSuccessResponse({
        evaluations: [],
        count: 0
      });
    }
    
    const values = range.getValues();
    const headers = values[0];
    const evaluations = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const evaluation = {};
      
      headers.forEach((header, index) => {
        evaluation[header] = row[index];
      });
      
      evaluations.push(evaluation);
    }
    
    return createSuccessResponse({
      evaluations: evaluations,
      count: evaluations.length
    });
    
  } catch (error) {
    console.error('Error in getEvaluations:', error);
    return createErrorResponse('Failed to get evaluations: ' + error.toString());
  }
}

function getEvaluationStatistics(courseId, startDate, endDate) {
  try {
    console.log('=== getEvaluationStatistics called ===', { courseId, startDate, endDate });
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let allEvaluations = [];
    let coursesData = {};
    
    // Get courses info
    const coursesSheet = spreadsheet.getSheetByName('courses');
    if (coursesSheet && coursesSheet.getDataRange().getNumRows() > 1) {
      const coursesValues = coursesSheet.getDataRange().getValues();
      for (let i = 1; i < coursesValues.length; i++) {
        const course = coursesValues[i];
        coursesData[course[1]] = {
          name: course[2],
          category: course[3]
        };
      }
    }
    
    // Get evaluation data from sheets
    const sheets = spreadsheet.getSheets();
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      
      // Check if it's an evaluation sheet (with s)
      if (sheetName.startsWith('evaluations_')) {
        const currentCourseCode = sheetName.replace('evaluations_', '');
        
        // Skip if specific course requested and doesn't match
        if (courseId && currentCourseCode !== courseId) {
          return;
        }
        
        const range = sheet.getDataRange();
        if (range.getNumRows() <= 1) return;
        
        const values = range.getValues();
        const headers = values[0];
        
        // Process evaluation data
        for (let i = 1; i < values.length; i++) {
          const row = values[i];
          const evaluation = {};
          
          headers.forEach((header, index) => {
            evaluation[header] = row[index];
          });
          
          // Filter by date range if provided
          if (startDate || endDate) {
            const evalDate = new Date(evaluation.timestamp);
            if (startDate && evalDate < new Date(startDate)) return;
            if (endDate && evalDate > new Date(endDate)) return;
          }
          
          // Add course info
          evaluation.courseCode = currentCourseCode;
          evaluation.courseName = coursesData[currentCourseCode]?.name || currentCourseCode;
          
          allEvaluations.push(evaluation);
        }
      }
    });
    
    // Calculate comprehensive statistics
    const stats = {
      totalEvaluations: allEvaluations.length,
      coursesCount: Object.keys(coursesData).length,
      responseRate: 85, // Mock response rate
      
      categoryAverages: {
        clarity: 0,
        preparation: 0,
        interaction: 0,
        punctuality: 0,
        satisfaction: 0
      },
      
      ratingDistribution: {
        rating1: 0,
        rating2: 0,
        rating3: 0,
        rating4: 0,
        rating5: 0
      },
      
      courseAverages: {},
      timeSeriesData: [],
      evaluations: allEvaluations
    };
    
    if (allEvaluations.length > 0) {
      // Calculate statistics
      let totalClarity = 0, totalPrep = 0, totalInter = 0, totalPunct = 0, totalSatis = 0;
      let courseRatings = {};
      let dateGroups = {};
      
      allEvaluations.forEach(evaluation => {
        const clarity = parseFloat(evaluation.clarity) || 0;
        const preparation = parseFloat(evaluation.preparation) || 0;
        const interaction = parseFloat(evaluation.interaction) || 0;
        const punctuality = parseFloat(evaluation.punctuality) || 0;
        const satisfaction = parseFloat(evaluation.satisfaction) || 0;
        
        totalClarity += clarity;
        totalPrep += preparation;
        totalInter += interaction;
        totalPunct += punctuality;
        totalSatis += satisfaction;
        
        // Overall average for distribution
        const overallRating = Math.round((clarity + preparation + interaction + punctuality + satisfaction) / 5);
        stats.ratingDistribution[`rating${overallRating}`]++;
        
        // Course averages
        if (!courseRatings[evaluation.courseCode]) {
          courseRatings[evaluation.courseCode] = [];
        }
        courseRatings[evaluation.courseCode].push((clarity + preparation + interaction + punctuality + satisfaction) / 5);
        
        // Time series data
        const evalDate = new Date(evaluation.timestamp).toISOString().split('T')[0];
        if (!dateGroups[evalDate]) {
          dateGroups[evalDate] = [];
        }
        dateGroups[evalDate].push((clarity + preparation + interaction + punctuality + satisfaction) / 5);
      });
      
      const count = allEvaluations.length;
      stats.categoryAverages = {
        clarity: Math.round((totalClarity / count) * 100) / 100,
        preparation: Math.round((totalPrep / count) * 100) / 100,
        interaction: Math.round((totalInter / count) * 100) / 100,
        punctuality: Math.round((totalPunct / count) * 100) / 100,
        satisfaction: Math.round((totalSatis / count) * 100) / 100
      };
      
      // Course averages
      Object.keys(courseRatings).forEach(courseCode => {
        const ratings = courseRatings[courseCode];
        const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        stats.courseAverages[courseCode] = Math.round(average * 100) / 100;
      });
      
      // Time series data
      Object.keys(dateGroups).sort().forEach(date => {
        const ratings = dateGroups[date];
        const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        stats.timeSeriesData.push({
          date: date,
          average: Math.round(average * 100) / 100,
          count: ratings.length
        });
      });
      
      // Overall average
      const allRatings = allEvaluations.map(e => 
        (parseFloat(e.clarity) + parseFloat(e.preparation) + parseFloat(e.interaction) + 
         parseFloat(e.punctuality) + parseFloat(e.satisfaction)) / 5
      );
      stats.overallAverage = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
    }
    
    return createSuccessResponse(stats);
    
  } catch (error) {
    console.error('Error in getEvaluationStatistics:', error);
    return createErrorResponse('Failed to get statistics: ' + error.toString());
  }
}

function setupEvaluationSheet(sheet) {
  const headers = [
    'evaluation_id', 'course_code', 'center', 'week', 'day', 'period', 
    'instructor', 'clarity', 'preparation', 'interaction', 
    'punctuality', 'satisfaction', 'comment', 'timestamp',
    'course_name', 'course_category'
  ];
  
  sheet.appendRow(headers);
  
  // Enhanced header formatting
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#667eea')
            .setFontColor('#ffffff')
            .setFontWeight('bold')
            .setFontSize(12)
            .setHorizontalAlignment('center')
            .setVerticalAlignment('middle');
  
  // Add borders to header
  headerRange.setBorder(true, true, true, true, true, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // Set column widths
  const colWidths = [120, 100, 80, 60, 80, 80, 120, 80, 100, 100, 100, 100, 200, 150, 200, 120];
  colWidths.forEach((width, index) => {
    if (index + 1 <= headers.length) {
      sheet.setColumnWidth(index + 1, width);
    }
  });
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

function formatEvaluationRow(sheet, rowNumber) {
  const ratingColumns = [8, 9, 10, 11, 12]; // clarity, preparation, interaction, punctuality, satisfaction
  
  ratingColumns.forEach(colIndex => {
    const cell = sheet.getRange(rowNumber, colIndex);
    const rating = cell.getValue();
    
    if (rating >= 5) {
      cell.setBackground('#10b981').setFontColor('#ffffff').setFontWeight('bold'); // Excellent - Green
    } else if (rating >= 4) {
      cell.setBackground('#3b82f6').setFontColor('#ffffff').setFontWeight('bold'); // Good - Blue
    } else if (rating >= 3) {
      cell.setBackground('#f59e0b').setFontColor('#ffffff').setFontWeight('bold'); // Fair - Orange
    } else if (rating >= 1) {
      cell.setBackground('#ef4444').setFontColor('#ffffff').setFontWeight('bold'); // Poor - Red
    }
  });
  
  // Format instructor name column with special styling
  const instructorCell = sheet.getRange(rowNumber, 7); // instructor column
  instructorCell.setFontWeight('bold').setFontColor('#059669');
  
  // Format course name with special styling
  const courseCell = sheet.getRange(rowNumber, 15); // course_name column
  courseCell.setFontWeight('bold').setFontColor('#4f46e5');
  
  // Add borders to the entire row
  const rowRange = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn());
  rowRange.setBorder(false, false, true, false, false, false, '#e5e7eb', SpreadsheetApp.BorderStyle.SOLID);
}

// =============================================================================
// 👨‍🏫 INSTRUCTOR MANAGEMENT - Enhanced for Multiple Courses
// =============================================================================

function getInstructors(courseId = null) {
  try {
    console.log('=== getInstructors called ===', courseId);
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // If no courseId provided, try to get from first available course
    if (!courseId) {
      const coursesSheet = spreadsheet.getSheetByName('courses');
      if (coursesSheet && coursesSheet.getDataRange().getNumRows() > 1) {
        const coursesData = coursesSheet.getDataRange().getValues();
        if (coursesData.length > 1) {
          courseId = coursesData[1][1]; // Use first course's code (column 1, not 0)
          console.log('Using first course for instructors:', courseId);
        }
      }
      
      if (!courseId) {
        courseId = 'DEFAULT';
      }
    }
    
    // Use course-specific instructor sheet name
    const sheetName = `Instructors_${courseId}`;
    let instructorsSheet = spreadsheet.getSheetByName(sheetName);
    
    // Create instructors sheet if it doesn't exist
    if (!instructorsSheet) {
      instructorsSheet = spreadsheet.insertSheet(sheetName);
      setupInstructorsSheet(instructorsSheet);
      createSampleInstructorData(instructorsSheet);
    }
    
    const range = instructorsSheet.getDataRange();
    if (range.getNumRows() <= 1) {
      createSampleInstructorData(instructorsSheet);
    }
    
    const values = instructorsSheet.getDataRange().getValues();
    if (values.length <= 1) {
      return createSuccessResponse({
        instructors: [],
        count: 0
      });
    }
    
    const headers = values[0];
    const instructors = [];
    
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const instructor = {};
      
      headers.forEach((header, index) => {
        instructor[header] = row[index];
      });
      
      instructors.push(instructor);
    }
    
    return createSuccessResponse({
      instructors: instructors,
      count: instructors.length,
      sheetName: sheetName
    });
    
  } catch (error) {
    console.error('Error in getInstructors:', error);
    return createErrorResponse('Failed to get instructors: ' + error.toString());
  }
}

function setupInstructorsSheet(sheet) {
  const headers = [
    'ศูนย์', 'สัปดาห์', 'วัน', 'ช่วงเวลา', 'ผู้สอน1', 'ผู้สอน2'
  ];
  
  sheet.appendRow(headers);
  
  // Enhanced header formatting
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#059669')
            .setFontColor('#ffffff')
            .setFontWeight('bold')
            .setFontSize(12)
            .setHorizontalAlignment('center')
            .setVerticalAlignment('middle');
  
  // Add borders to header
  headerRange.setBorder(true, true, true, true, true, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  
  // Set specific column widths
  sheet.setColumnWidth(1, 120);  // ศูนย์
  sheet.setColumnWidth(2, 80);   // สัปดาห์
  sheet.setColumnWidth(3, 100);  // วัน
  sheet.setColumnWidth(4, 100);  // ช่วงเวลา
  sheet.setColumnWidth(5, 150);  // ผู้สอน1
  sheet.setColumnWidth(6, 150);  // ผู้สอน2
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  // Add data validation for instructor columns
  setupInstructorDropdowns(sheet);
}

function setupInstructorDropdowns(sheet) {
  const instructorList = [
    '', 'พี่เพชร', 'พี่ธาม', 'พี่เก๊ก', 'พี่ออค', 'พี่แก้ม', 'พี่ปอ', 'พี่เซนต์', 'พี่แพร',
    'พี่ลม', 'พี่กอล์ฟ', 'พี่กัน', 'พี่กาน', 'พี่โฟกัส', 'พี่บรีฟ', 'พี่ริว', 'พี่บี', 'พี่ไก่', 'พี่โอม'
  ];
  
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(instructorList, true)
    .setAllowInvalid(false)
    .setHelpText('เลือกชื่อผู้สอนจากรายการ')
    .build();
  
  const instructorRange1 = sheet.getRange('E2:E1000');
  const instructorRange2 = sheet.getRange('F2:F1000');
  
  instructorRange1.setDataValidation(rule);
  instructorRange2.setDataValidation(rule);
  
  console.log('Instructor dropdowns set up with', instructorList.length - 1, 'instructors');
}

function createSampleInstructorData(sheet) {
  const centers = ['ลาดกระบัง', 'บางพลัด', 'ศรีราชา', 'ระยอง'];
  const days = ['เสาร์', 'อาทิตย์'];
  const periods = ['เช้า', 'บ่าย'];
  
  const instructorTemplate = [];
  
  // สร้างข้อมูลสำหรับ 8 สัปดาห์
  for (let week = 1; week <= 8; week++) {
    for (let center of centers) {
      for (let day of days) {
        for (let period of periods) {
          instructorTemplate.push([center, week, day, period, '', '']);
        }
      }
    }
  }
  
  // เพิ่มข้อมูลลงใน sheet ทีละแถว
  instructorTemplate.forEach(row => {
    sheet.appendRow(row);
  });
  
  // จัดรูปแบบตาราง
  formatInstructorSheet(sheet, instructorTemplate.length);
  
  console.log(`Created instructor template: ${instructorTemplate.length} rows`);
}

function formatInstructorSheet(sheet, dataRows) {
  try {
    const totalRows = dataRows + 1;
    const totalCols = 6;
    
    const centerColors = {
      'ลาดกระบัง': '#FFF2CC',
      'บางพลัด': '#E1D5E7',
      'ศรีราชา': '#DAE8FC',
      'ระยอง': '#D5E8D4'
    };
    
    // Format data rows
    for (let row = 2; row <= totalRows; row++) {
      const centerCell = sheet.getRange(row, 1);
      const centerName = centerCell.getValue();
      const rowRange = sheet.getRange(row, 1, 1, totalCols);
      
      if (centerName && centerColors[centerName]) {
        rowRange.setBackground(centerColors[centerName]);
      }
      
      rowRange.setHorizontalAlignment('center');
      rowRange.setVerticalAlignment('middle');
      rowRange.setFontSize(10);
      rowRange.setBorder(true, true, true, true, true, true, '#E0E0E0', SpreadsheetApp.BorderStyle.SOLID);
      
      if ((row - 2) % 16 === 0 && row > 2) {
        rowRange.setBorder(true, true, true, true, true, true, '#4CAF50', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      }
    }
    
    console.log('Formatted instructor sheet with clean styling');
    
  } catch (error) {
    console.error('Error formatting instructor sheet:', error);
  }
}

// =============================================================================
// 🎨 SHEET FORMATTING FUNCTIONS
// =============================================================================

function beautifyAllSheets() {
  try {
    console.log('Starting sheet beautification process...');
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    
    sheets.forEach(sheet => {
      const sheetName = sheet.getName();
      console.log('Beautifying sheet:', sheetName);
      
      if (sheetName.startsWith('evaluations_')) {
        beautifyEvaluationSheet(sheet);
      } else if (sheetName === 'courses') {
        beautifyCoursesSheet(sheet);
      } else if (sheetName.startsWith('Instructors_')) {
        beautifyInstructorsSheet(sheet);
      }
    });
    
    console.log('Sheet beautification completed!');
    return createSuccessResponse({
      message: 'All sheets have been beautified successfully!',
      sheetsProcessed: sheets.length
    });
    
  } catch (error) {
    console.error('Error beautifying sheets:', error);
    return createErrorResponse('Failed to beautify sheets: ' + error.toString());
  }
}

function beautifyEvaluationSheet(sheet) {
  const lastRow = sheet.getLastRow();
  
  // Always format header row first
  if (lastRow >= 1) {
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setBackground('#667eea')
              .setFontColor('#ffffff')
              .setFontWeight('bold')
              .setFontSize(12)
              .setHorizontalAlignment('center')
              .setVerticalAlignment('middle');
    headerRange.setBorder(true, true, true, true, true, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
  }
  
  if (lastRow <= 1) {
    const colWidths = [120, 100, 80, 60, 80, 80, 120, 80, 100, 100, 100, 100, 200, 150, 200, 120];
    colWidths.forEach((width, index) => {
      if (index + 1 <= sheet.getLastColumn()) {
        sheet.setColumnWidth(index + 1, width);
      }
    });
    sheet.setFrozenRows(1);
    return;
  }
  
  // Apply alternating row colors for data rows
  for (let i = 2; i <= lastRow; i++) {
    const rowRange = sheet.getRange(i, 1, 1, sheet.getLastColumn());
    if (i % 2 === 0) {
      rowRange.setBackground('#fafbfc');
    } else {
      rowRange.setBackground('#ffffff');
    }
    
    formatEvaluationRow(sheet, i);
  }
}

function beautifyCoursesSheet(sheet) {
  const lastRow = sheet.getLastRow();
  
  if (lastRow >= 1) {
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setBackground('#4f46e5')
              .setFontColor('#ffffff')
              .setFontWeight('bold')
              .setFontSize(12)
              .setHorizontalAlignment('center')
              .setVerticalAlignment('middle');
    headerRange.setBorder(true, true, true, true, true, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    
    const colWidths = [80, 120, 300, 120, 100, 400, 80, 150, 150];
    colWidths.forEach((width, index) => {
      if (index + 1 <= sheet.getLastColumn()) {
        sheet.setColumnWidth(index + 1, width);
      }
    });
    sheet.setFrozenRows(1);
  }
  
  if (lastRow <= 1) return;
  
  for (let i = 2; i <= lastRow; i++) {
    const rowRange = sheet.getRange(i, 1, 1, sheet.getLastColumn());
    if (i % 2 === 0) {
      rowRange.setBackground('#f8fafc');
    } else {
      rowRange.setBackground('#ffffff');
    }
    
    sheet.getRange(i, 3).setFontWeight('bold').setFontColor('#4f46e5');
    
    const statusCell = sheet.getRange(i, 7);
    const status = statusCell.getValue();
    if (status === 'active' || status === 'Active') {
      statusCell.setBackground('#d1fae5').setFontColor('#065f46').setFontWeight('bold');
    } else if (status === 'inactive' || status === 'Inactive') {
      statusCell.setBackground('#fef2f2').setFontColor('#991b1b').setFontWeight('bold');
    }
  }
}

function beautifyInstructorsSheet(sheet) {
  const lastRow = sheet.getLastRow();
  
  if (lastRow >= 1) {
    const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
    headerRange.setBackground('#059669')
              .setFontColor('#ffffff')
              .setFontWeight('bold')
              .setFontSize(12)
              .setHorizontalAlignment('center')
              .setVerticalAlignment('middle');
    headerRange.setBorder(true, true, true, true, true, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    
    const colWidths = [120, 80, 100, 100, 150, 150];
    colWidths.forEach((width, index) => {
      if (index + 1 <= sheet.getLastColumn()) {
        sheet.setColumnWidth(index + 1, width);
      }
    });
    sheet.setFrozenRows(1);
  }
  
  if (lastRow <= 1) return;
  
  for (let i = 2; i <= lastRow; i++) {
    const rowRange = sheet.getRange(i, 1, 1, sheet.getLastColumn());
    if (i % 2 === 0) {
      rowRange.setBackground('#f0fdf4');
    } else {
      rowRange.setBackground('#ffffff');
    }
    
    sheet.getRange(i, 5).setFontWeight('bold').setFontColor('#059669');
    sheet.getRange(i, 6).setFontWeight('bold').setFontColor('#059669');
    sheet.getRange(i, 1).setFontWeight('bold').setFontColor('#1f2937');
  }
}

// =============================================================================
// 🔧 UTILITY FUNCTIONS
// =============================================================================

function createHealthResponse() {
  try {
    let spreadsheetInfo = null;
    try {
      const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      const sheets = spreadsheet.getSheets();
      spreadsheetInfo = {
        id: spreadsheet.getId(),
        name: spreadsheet.getName(),
        sheetCount: sheets.length,
        sheetNames: sheets.map(sheet => sheet.getName())
      };
    } catch (e) {
      console.log('Could not get spreadsheet info:', e);
      spreadsheetInfo = { error: 'No spreadsheet access' };
    }

    const health = {
      status: 'success',
      message: 'Multi-Course Teaching Evaluation System is running',
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      system: {
        timezone: 'Asia/Bangkok',
        locale: 'th-TH',
        mode: 'web_app'
      },
      spreadsheet: spreadsheetInfo
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(health))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('Health check error:', error);
    const errorResponse = {
      status: 'error',
      message: 'Health check failed',
      error: error.toString(),
      version: '3.0.0',
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function createSuccessResponse(data) {
  const response = {
    status: 'success',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    data: data || {}
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

function createErrorResponse(message, errorType = 'system_error') {
  const response = {
    status: 'error',
    timestamp: new Date().toISOString(),
    version: '3.0.0',
    error: {
      message: message || 'An unknown error occurred',
      type: errorType
    }
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// =============================================================================
// 🎛️ ADMIN FUNCTIONS - For Google Sheets Menu
// =============================================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🎓 Multi-Course Evaluation System')
    .addItem('📊 System Health Check', 'showSystemHealth')
    .addItem('📈 Generate Statistics Report', 'generateStatisticsReport')
    .addItem('📤 Export All Data', 'exportAllData')
    .addSeparator()
    .addItem('🔧 Setup Sample Courses', 'setupSampleCourses')
    .addItem('👨‍🏫 Setup Sample Instructors', 'setupSampleInstructorsMenu')
    .addItem('📋 Create Sheets for All Courses', 'createSheetsForAllCourses')
    .addSeparator()
    .addItem('ℹ️ About System', 'showAboutSystem')
    .addToUi();
}

function showSystemHealth() {
  const ui = SpreadsheetApp.getUi();
  const health = createHealthResponse();
  const healthData = JSON.parse(health.getContent());
  
  const sheetsInfo = healthData.spreadsheet && healthData.spreadsheet.sheetCount 
    ? healthData.spreadsheet.sheetCount 
    : 'Unknown';
  
  ui.alert('System Health', 
    `System Status: ${healthData.status}\n` +
    `Version: ${healthData.version}\n` +
    `Sheets: ${sheetsInfo}\n` +
    `Last Check: ${healthData.timestamp}`, 
    ui.ButtonSet.OK);
}

function generateStatisticsReport() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('Statistics Report', 
    'Statistics report generation feature will be implemented in the admin dashboard.', 
    ui.ButtonSet.OK);
}

function exportAllData() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('Export Complete', 
    'Data export feature will be implemented in the admin dashboard.', 
    ui.ButtonSet.OK);
}

function setupSampleCourses() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let coursesSheet = spreadsheet.getSheetByName('courses');
    
    if (!coursesSheet) {
      coursesSheet = spreadsheet.insertSheet('courses');
      setupCoursesSheet(coursesSheet);
    }
    
    // Clear existing data (except headers)
    if (coursesSheet.getLastRow() > 1) {
      coursesSheet.getRange(2, 1, coursesSheet.getLastRow() - 1, coursesSheet.getLastColumn()).clear();
    }
    
    // Add sample courses
    const sampleCourses = [
      ['1', 'PS001', 'Power Supply', 'electronics', 16, 'หลักสูตรการออกแบบและซ่อมบำรุงแหล่งจ่ายไฟ', 'active', new Date().toISOString(), new Date().toISOString()],
      ['2', 'ARD001', 'Arduino Programming', 'programming', 20, 'หลักสูตรการเขียนโปรแกรมและควบคุมด้วย Arduino', 'active', new Date().toISOString(), new Date().toISOString()],
      ['3', 'EL001', 'Basic Electronics', 'electronics', 24, 'หลักสูตรพื้นฐานอิเล็กทรอนิกส์', 'active', new Date().toISOString(), new Date().toISOString()],
      ['4', 'PLC001', 'PLC Programming', 'programming', 18, 'หลักสูตรการเขียนโปรแกรม PLC', 'active', new Date().toISOString(), new Date().toISOString()],
      ['5', 'MCH001', 'Mechanical Systems', 'mechanical', 22, 'หลักสูตรระบบเครื่องกล', 'active', new Date().toISOString(), new Date().toISOString()]
    ];
    
    sampleCourses.forEach(course => {
      coursesSheet.appendRow(course);
    });
    
    const ui = SpreadsheetApp.getUi();
    ui.alert('Setup Complete', 
      `Successfully created ${sampleCourses.length} sample courses in the 'courses' sheet.`, 
      ui.ButtonSet.OK);
      
  } catch (error) {
    const ui = SpreadsheetApp.getUi();
    ui.alert('Error', 'Failed to setup sample courses: ' + error.toString(), ui.ButtonSet.OK);
  }
}

function setupSampleInstructorsMenu() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let instructorsSheet = spreadsheet.getSheetByName('instructors');
    
    if (!instructorsSheet) {
      instructorsSheet = spreadsheet.insertSheet('instructors');
      setupInstructorsSheet(instructorsSheet);
    }
    
    if (instructorsSheet.getLastRow() > 1) {
      instructorsSheet.getRange(2, 1, instructorsSheet.getLastRow() - 1, instructorsSheet.getLastColumn()).clear();
    }
    
    createSampleInstructorData(instructorsSheet);
    
    const ui = SpreadsheetApp.getUi();
    ui.alert('Setup Complete', 
      'Successfully created sample instructors in the \'instructors\' sheet.', 
      ui.ButtonSet.OK);
      
  } catch (error) {
    const ui = SpreadsheetApp.getUi();
    ui.alert('Error', 'Failed to setup sample instructors: ' + error.toString(), ui.ButtonSet.OK);
  }
}

function showAboutSystem() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('About Multi-Course Evaluation System', 
    'Version: 3.0.0\n' +
    'Enhanced Teaching Evaluation System with Multiple Course Support\n\n' +
    'Features:\n' +
    '• Multiple course management\n' +
    '• Enhanced evaluation forms\n' +
    '• Real-time statistics\n' +
    '• Improved data organization\n\n' +
    'Developed for educational institutions', 
    ui.ButtonSet.OK);
}

console.log('⚡ Multi-Course Teaching Evaluation System v3.0.0 loaded successfully!');
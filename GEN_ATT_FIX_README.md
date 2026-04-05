# GEN_ATT Subject Display Fix

## Issue Description
GEN_ATT (General Attendance) subjects were appearing in student academic displays where they shouldn't. These are attendance-only subjects with no grades that should be excluded from:
- Academic performance summaries
- Grade transcripts
- Problem subjects lists
- GPA calculations
- Subject difficulty analysis

## Solution Implemented

### 1. Frontend Filter (Immediate Fix)
Created a shared utility function to filter out GEN_ATT subjects:

**File:** `src/utils/subjectFilters.js`
- `isGradedSubject(record)` - Checks if a subject is graded (non-attendance-only)
- `filterGradedSubjects(records)` - Filters array to exclude attendance-only subjects
- `isAttendanceOnlySubject(record)` - Opposite of isGradedSubject

### 2. Updated Components

**StudentProfile360.tsx:**
- Added filter to `allSemGrades` to exclude GEN_ATT subjects from all academic displays
- This affects:
  - Semester performance summaries
  - Complete academic transcript
  - Problem subjects section
  - SGPA calculations

**academicService.js:**
- Updated key functions to filter out GEN_ATT subjects:
  - `buildStudentStrengths()` - Student strength/weakness analysis
  - `buildSubjectDifficulty()` - Subject difficulty metrics
  - `groupSemesterTrend()` - Semester performance trends
  - `buildHeatmap()` - Performance heatmap data

### 3. Filter Logic
Subjects are excluded if their `subject_code` or `subject_name` contains "GEN_ATT" (case-insensitive).

### 4. Testing
Created test file: `src/test/genAttFilter.test.js` to validate the filtering logic.

## Database Solution (Future)

For a more robust long-term solution, consider:

1. **Add subject_type column to subjects table:**
   ```sql
   ALTER TABLE subjects ADD COLUMN subject_type VARCHAR(20) DEFAULT 'THEORY';
   ```

2. **Update existing GEN_ATT subjects:**
   ```sql
   UPDATE subjects 
   SET subject_type = 'ATTENDANCE_ONLY' 
   WHERE course_code ILIKE '%GEN_ATT%' OR name ILIKE '%GEN_ATT%';
   ```

3. **Backend filtering in student_service.py:**
   ```sql
   AND s.subject_type NOT IN ('ATTENDANCE_ONLY')
   ```

## Files Modified
- `src/utils/subjectFilters.js` (new)
- `src/components/StudentProfile360.tsx`
- `src/services/academicService.js`
- `src/test/genAttFilter.test.js` (new)

## Impact
- GEN_ATT subjects no longer appear in student academic transcripts
- Academic performance metrics exclude attendance-only subjects
- Subject difficulty analysis focuses on graded subjects only
- GPA calculations are more accurate

## Verification
1. Navigate to `http://localhost:5173/admin?tab=Students`
2. Click on any student to open Student 360 view
3. Check that GEN_ATT subjects don't appear in:
   - Academic Performance section
   - Complete Academic Transcript
   - Problem Subjects list
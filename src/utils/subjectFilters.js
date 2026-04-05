/**
 * Utility functions for filtering academic subjects
 */

/**
 * Check if a subject record represents a graded (non-attendance-only) subject
 * @param {Object} record - Subject/grade record with subject_code, subject_name, or subject_title
 * @returns {boolean} - True if it's a graded subject, false if it's attendance-only
 */
export const isGradedSubject = (record) => {
  if (!record) return false;
  
  // Get subject identifiers
  const subjectCode = record.subject_code || '';
  const subjectName = record.subject_name || record.subject_title || '';
  
  // Filter out attendance-only subjects (GEN_ATT)
  return !subjectCode.toUpperCase().includes('GEN_ATT') && 
         !subjectName.toUpperCase().includes('GEN_ATT');
};

/**
 * Filter an array of grade/subject records to exclude attendance-only subjects
 * @param {Array} records - Array of grade/subject records
 * @returns {Array} - Filtered array excluding attendance-only subjects
 */
export const filterGradedSubjects = (records = []) => {
  return records.filter(isGradedSubject);
};

/**
 * Check if a subject is attendance-only (opposite of isGradedSubject)
 * @param {Object} record - Subject/grade record
 * @returns {boolean} - True if it's attendance-only, false otherwise
 */
export const isAttendanceOnlySubject = (record) => {
  return !isGradedSubject(record);
};
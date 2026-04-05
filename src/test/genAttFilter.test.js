// Test script to validate GEN_ATT filtering
import { isGradedSubject, filterGradedSubjects } from '../utils/subjectFilters.js';

// Sample test data
const testData = [
  { subject_code: 'CS101', subject_name: 'Computer Science Fundamentals', grade: 'A' },
  { subject_code: 'GEN_ATT_001', subject_name: 'General Attendance', grade: 'P' },
  { subject_code: 'MATH201', subject_name: 'Advanced Mathematics', grade: 'B+' },
  { subject_code: 'PHY101', subject_name: 'GEN_ATT Physics', grade: 'C' },
  { subject_code: 'ENG301', subject_name: 'English Literature', grade: 'A-' },
  { subject_code: 'ATT_GEN', subject_name: 'Attendance General', grade: 'P' }
];

console.log('=== Testing GEN_ATT Subject Filtering ===');
console.log('Original data:', testData.length, 'subjects');

testData.forEach((subject, index) => {
  const isGraded = isGradedSubject(subject);
  console.log(`${index + 1}. ${subject.subject_code} - "${subject.subject_name}" -> ${isGraded ? 'INCLUDE' : 'EXCLUDE'}`);
});

const filteredData = filterGradedSubjects(testData);
console.log('\nFiltered data:', filteredData.length, 'subjects');
console.log('Expected: 3 subjects (CS101, MATH201, ENG301)');
console.log('Actual subjects:');
filteredData.forEach((subject, index) => {
  console.log(`${index + 1}. ${subject.subject_code} - "${subject.subject_name}"`);
});

const expectedCodes = ['CS101', 'MATH201', 'ENG301'];
const actualCodes = filteredData.map(s => s.subject_code);
const isCorrect = expectedCodes.length === actualCodes.length && 
                  expectedCodes.every(code => actualCodes.includes(code));

console.log('\nTest Result:', isCorrect ? '✅ PASS' : '❌ FAIL');
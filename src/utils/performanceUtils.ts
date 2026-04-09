import { PerformanceClassification, StudentPerformanceMetrics } from '../types/enterprise';

/**
 * Performance classification utility functions for subject-level analytics
 * Implements hybrid percentile + threshold based performance system
 */

/**
 * Calculate percentile rank for a student's marks within a subject
 * @param studentMarks The student's marks
 * @param allMarks Array of all marks in the subject
 * @returns Percentile rank (0-100)
 */
export function calculatePercentile(studentMarks: number, allMarks: number[]): number {
  if (!allMarks.length) return 0;
  
  const belowCount = allMarks.filter(marks => marks < studentMarks).length;
  const equalCount = allMarks.filter(marks => marks === studentMarks).length;
  
  // Use average rank method for ties
  const percentile = ((belowCount + equalCount / 2) / allMarks.length) * 100;
  return Math.round(percentile * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate normalized score relative to subject average
 * @param studentMarks The student's marks
 * @param subjectAverage Average marks for the subject
 * @returns Normalized score (student_marks / subject_average)
 */
export function calculateNormalizedScore(studentMarks: number, subjectAverage: number): number {
  if (subjectAverage === 0) return 0;
  return Math.round((studentMarks / subjectAverage) * 100) / 100; // Round to 2 decimal places
}

/**
 * Classify student performance based on hybrid percentile + threshold system
 * Rules:
 * - If marks < pass_threshold OR percentile < 30 → At Risk
 * - Percentile 30-60 → Average
 * - Percentile 60-85 → Good
 * - Percentile > 85 → Excellent
 */
export function classifyPerformance(
  studentMarks: number,
  percentile: number,
  passThreshold: number
): PerformanceClassification {
  // At Risk: Below pass threshold OR bottom 30th percentile
  if (studentMarks < passThreshold || percentile < 30) {
    return 'At Risk';
  }
  
  // Percentile-based classification
  if (percentile >= 85) {
    return 'Excellent';
  } else if (percentile >= 60) {
    return 'Good';
  } else {
    return 'Average';
  }
}

/**
 * Calculate complete performance metrics for a student in a subject
 */
export function calculateStudentPerformance(
  studentMarks: number,
  allSubjectMarks: number[],
  passThreshold: number = 40
): StudentPerformanceMetrics {
  const subjectAverage = allSubjectMarks.reduce((sum, marks) => sum + marks, 0) / allSubjectMarks.length;
  const percentile = calculatePercentile(studentMarks, allSubjectMarks);
  const normalizedScore = calculateNormalizedScore(studentMarks, subjectAverage);
  const classification = classifyPerformance(studentMarks, percentile, passThreshold);
  
  return {
    student_marks: studentMarks,
    percentile,
    normalized_score: normalizedScore,
    classification,
  };
}

/**
 * Get performance classification badge style classes
 */
export function getClassificationStyle(classification: PerformanceClassification): string {
  switch (classification) {
    case 'At Risk':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'Average':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'Good':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'Excellent':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
}

/**
 * Validate pass threshold input
 */
export function validatePassThreshold(threshold: number): { isValid: boolean; error?: string } {
  if (threshold < 0) {
    return { isValid: false, error: 'Pass threshold must be non-negative' };
  }
  if (threshold > 100) {
    return { isValid: false, error: 'Pass threshold cannot exceed 100' };
  }
  return { isValid: true };
}

/**
 * Get subject performance statistics
 */
export interface SubjectPerformanceStats {
  totalStudents: number;
  atRiskCount: number;
  averageCount: number;
  goodCount: number;
  excellentCount: number;
  averageMarks: number;
  passRate: number; // Percentage above pass threshold
}

export function getSubjectPerformanceStats(
  allMarks: number[],
  passThreshold: number = 40
): SubjectPerformanceStats {
  if (!allMarks.length) {
    return {
      totalStudents: 0,
      atRiskCount: 0,
      averageCount: 0,
      goodCount: 0,
      excellentCount: 0,
      averageMarks: 0,
      passRate: 0,
    };
  }
  
  const classifications = allMarks.map(marks => {
    const percentile = calculatePercentile(marks, allMarks);
    return classifyPerformance(marks, percentile, passThreshold);
  });
  
  const averageMarks = allMarks.reduce((sum, marks) => sum + marks, 0) / allMarks.length;
  const passedStudents = allMarks.filter(marks => marks >= passThreshold).length;
  
  return {
    totalStudents: allMarks.length,
    atRiskCount: classifications.filter(c => c === 'At Risk').length,
    averageCount: classifications.filter(c => c === 'Average').length,
    goodCount: classifications.filter(c => c === 'Good').length,
    excellentCount: classifications.filter(c => c === 'Excellent').length,
    averageMarks: Math.round(averageMarks * 100) / 100,
    passRate: Math.round((passedStudents / allMarks.length) * 100 * 100) / 100,
  };
}
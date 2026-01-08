
import React from 'react';
import { Subject } from './types';

export const SUBJECTS: Subject[] = [
  { id: 'cs101', name: 'Computer Networks', code: 'CS101', color: 'bg-blue-500' },
  { id: 'cs102', name: 'Machine Learning', code: 'CS102', color: 'bg-purple-500' },
  { id: 'cs103', name: 'Operating Systems', code: 'CS103', color: 'bg-green-500' },
  { id: 'cs104', name: 'Database Systems', code: 'CS104', color: 'bg-orange-500' },
  { id: 'cs105', name: 'Artificial Intelligence', code: 'CS105', color: 'bg-indigo-500' },
];

export const UPVOTE_THRESHOLD = 5;
export const KARMA_REWARD = 10;

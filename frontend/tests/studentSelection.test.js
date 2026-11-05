import { describe, expect, it } from 'bun:test'
import {
  findStudentById,
  getBaseStudentId,
  getStudentOptions,
  normalizeStudentId,
} from '../src/pages/mtss/utils/studentSelection.js'

const STUDENT = '6aa899f203ab97018acec1d3'
const ASSIGNMENT = '6aa89ac903ab97018acec250'

// A student with two MTSS subjects shows up as two rows, one per subject.
const rows = [
  { id: `${STUDENT}:${ASSIGNMENT}:math`, baseStudentId: STUDENT, name: 'Ari Student' },
  { id: `${STUDENT}:6aa89ac903ab97018acec251:english`, baseStudentId: STUDENT, name: 'Ari Student' },
  { id: '6aa899f203ab97018acec1d4', name: 'Budi Student' },
]

describe('studentSelection', () => {
  it('turns the id of a support unit into the id of the student', () => {
    expect(normalizeStudentId(`${STUDENT}:${ASSIGNMENT}:math`)).toBe(STUDENT)
    expect(normalizeStudentId(STUDENT)).toBe(STUDENT)
    expect(normalizeStudentId('')).toBe('')
    expect(normalizeStudentId(undefined)).toBe('')
  })

  it('leaves an id that is not an object id as it is', () => {
    expect(normalizeStudentId('student-1')).toBe('student-1')
    expect(normalizeStudentId('student-1:x:math')).toBe('student-1:x:math')
  })

  it('reads the student of a row from the base id first, then the id', () => {
    expect(getBaseStudentId(rows[0])).toBe(STUDENT)
    expect(getBaseStudentId(rows[2])).toBe('6aa899f203ab97018acec1d4')
    expect(getBaseStudentId({ _id: STUDENT, id: 'other' })).toBe(STUDENT)
  })

  it('offers one choice per student, with the real id as its value', () => {
    expect(getStudentOptions(rows)).toEqual([
      { value: STUDENT, label: 'Ari Student' },
      { value: '6aa899f203ab97018acec1d4', label: 'Budi Student' },
    ])
    expect(getStudentOptions(undefined)).toEqual([])
  })

  it('finds the student by the real id or by the id of any of their rows', () => {
    expect(findStudentById(rows, STUDENT)?.name).toBe('Ari Student')
    expect(findStudentById(rows, `${STUDENT}:${ASSIGNMENT}:math`)?.name).toBe('Ari Student')
    expect(findStudentById(rows, 'missing')).toBeUndefined()
    expect(findStudentById(rows, '')).toBeUndefined()
  })
})

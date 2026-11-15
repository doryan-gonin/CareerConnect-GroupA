import { describe, expect, it } from 'vitest'
import { isPasswordValid, passwordRules } from './passwordRules'

describe('passwordRules', () => {
  it('accepts a password that satisfies every rule', () => {
    expect(isPasswordValid('Secure!123')).toBe(true)
    expect(passwordRules.every((rule) => rule.test('Secure!123'))).toBe(true)
  })

  it('rejects passwords that fail a required rule', () => {
    expect(isPasswordValid('short')).toBe(false)
    expect(isPasswordValid('lowercase123!')).toBe(false)
    expect(isPasswordValid('UPPERCASE123!')).toBe(false)
    expect(isPasswordValid('NoNumber!')).toBe(false)
  })

  it('enforces the 72-byte limit for multibyte passwords', () => {
    const longUnicodePassword = `${'é'.repeat(36)}A1!`
    expect(new TextEncoder().encode(longUnicodePassword).length).toBeGreaterThan(72)
    expect(isPasswordValid(longUnicodePassword)).toBe(false)
  })
})

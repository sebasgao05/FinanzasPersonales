import { describe, it, expect } from 'vitest'

describe('Vitest setup', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should support TypeScript', () => {
    const greeting: string = 'Hello Finanzas Personales'
    expect(greeting).toContain('Finanzas')
  })
})

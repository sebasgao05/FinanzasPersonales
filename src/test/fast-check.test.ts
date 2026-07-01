import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

describe('fast-check integration', () => {
  it('should support property-based testing', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        expect(a + b).toBe(b + a)
      })
    )
  })
})

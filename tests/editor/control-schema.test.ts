import { describe, expect, it } from 'vitest';
import { basicControlSchema } from '@/lib/editor/controlSchema';

describe('basic control schema', () => {
  it('describes user-facing controls with complete metadata', () => {
    for (const control of basicControlSchema) {
      expect(control.key).toBeTruthy();
      expect(control.label).not.toMatch(/^(N|O|S|ZS|ZE)$/);
      expect(control.description).toBeTruthy();
      expect(control.unit).toBeDefined();
      expect(control.min).toBeLessThanOrEqual(control.max);
      expect(control.step).toBeGreaterThan(0);
      expect(control.default).toBeDefined();
      expect(typeof control.advanced).toBe('boolean');
      expect(control.requiredCapability).toBeTruthy();
    }
  });
});

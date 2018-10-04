import Constants from '../src/Constants';

test('Expect the correct number of constants', () => {
  expect(Constants.CONSTRUCTION_POINTS_PER_BUILDER).toBe(10);
  expect(Constants.CONSTRUCTION_POINT_TTL).toBe(100);
  expect(Constants.CPU_ADJUST).toBe(0.05);
  expect(Constants.CPU_BOOST).toBe(0);
  expect(Constants.CPU_BUFFER).toBe(100);
  expect(Constants.CPU_MINIMUM).toBe(0.3);
  expect(Constants.SOURCE_POINT_TTL).toBe(100);
});

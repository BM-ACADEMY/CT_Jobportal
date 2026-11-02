const test = require('node:test');
const assert = require('node:assert/strict');
const { unwrapQuestions } = require('../../utils/questionBank');

test('unwrapQuestions accepts a bare list or a list wrapped in an object', () => {
  const list = [{ id: 1 }];
  assert.equal(unwrapQuestions(list), list);
  assert.equal(unwrapQuestions({ questions: list }), list);
  assert.equal(unwrapQuestions({ data: { x: 1 }, items: list }), list);
  assert.equal(unwrapQuestions({ questions: 'no' }), null);
  assert.equal(unwrapQuestions(null), null);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { FindEditing } from '../src/core/find-editing.ts';

test('pre-insertion selection distinguishes shared-prefix replacement, partial paste and Undo/Redo', () => {
  const edit = new FindEditing();
  assert.deepEqual(edit.change('response'), { text: 'response', edit: 'new' });
  edit.beforeInput('insertFromPaste', 'response', 0, 8);
  assert.deepEqual(edit.change('request'), { text: 'request', edit: 'new' });
  edit.beforeInput('insertFromPaste', 'request', 0, 7);
  assert.deepEqual(edit.change('request'), { text: 'request', edit: 'new' });
  edit.beforeInput('insertFromPaste', 'request', 2, 4);
  assert.deepEqual(edit.change('replace'), { text: 'replace', edit: 'refine' });
  edit.beforeInput('historyUndo', 'replace', 0, 7);
  assert.deepEqual(edit.change('request'), { text: 'request', edit: 'refine' });
  assert.deepEqual(edit.change(''), { text: '', edit: 'new' });
  edit.beforeInput('historyRedo', '', 0, 0);
  assert.deepEqual(edit.change('replace'), { text: 'replace', edit: 'new' });
});

test('composition captures replacement before insertion, commits once and cannot complete after Clear', () => {
  const edit = new FindEditing(); edit.change('response');
  edit.startComposition('response', 0, 8);
  assert.equal(edit.change('re', 'insertCompositionText'), undefined);
  assert.deepEqual(edit.endComposition('request'), { text: 'request', edit: 'new' });
  assert.equal(edit.change('request'), undefined);
  assert.equal(edit.endComposition('request'), undefined);
  edit.startComposition('request', 2, 4); edit.change('req'); edit.clear();
  assert.equal(edit.endComposition('resurrect'), undefined);
  assert.equal(edit.change('resurrect', 'insertCompositionText'), undefined);
  edit.beforeInput('insertText', '', 0, 0);
  assert.deepEqual(edit.change('new'), { text: 'new', edit: 'new' });
});

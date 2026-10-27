import type { FindEdit } from './find-state.ts';

export interface FindEditTransaction { text: string; edit: Exclude<FindEdit, 'maintenance'> }

/** Observe native transactions without rewriting the input or its undo stack. */
export class FindEditing {
  private text = '';
  private replacement = false;
  private composition?: { replacement: boolean };
  private canceledComposition = false;
  beforeInput(type: string, value: string, start: number | null, end: number | null) {
    if (this.composition) return;
    if (!type.includes('Composition')) this.canceledComposition = false;
    this.replacement = type.startsWith('insert') && !!value && start === 0 && end === value.length;
  }
  startComposition(value: string, start: number | null, end: number | null) {
    this.canceledComposition = false;
    this.composition = { replacement: this.replacement || (!!value && start === 0 && end === value.length) };
    this.replacement = false;
  }
  change(value: string, inputType = ''): FindEditTransaction | undefined {
    if (this.composition || (this.canceledComposition && inputType.includes('Composition'))) return;
    if (value === this.text && !this.replacement) return;
    const edit = !this.text || !value || this.replacement ? 'new' : 'refine';
    this.text = value; this.replacement = false;
    return { text: value, edit };
  }
  endComposition(value: string): FindEditTransaction | undefined {
    const composition = this.composition;
    if (!composition) return;
    this.composition = undefined;
    const edit = !this.text || !value || composition.replacement ? 'new' : 'refine';
    this.text = value;
    return { text: value, edit };
  }
  clear() {
    this.canceledComposition = !!this.composition;
    this.composition = undefined; this.replacement = false; this.text = '';
  }
}

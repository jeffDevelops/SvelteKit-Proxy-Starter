export type FieldValidator<T> = (value: T) => string | null

/**
 * Tracks a form field's value alongside whether it has been blurred, so
 * validation errors only surface after the user leaves the field instead of
 * on every keystroke. Replaces hand-rolled `xBlurred` state per field.
 */
export class ValidatedField<T> {
  value = $state() as T
  touched = $state(false)

  #initial: T
  #validate: FieldValidator<T>

  constructor(initial: T, validate: FieldValidator<T>) {
    this.value = initial
    this.#initial = initial
    this.#validate = validate
  }

  get error(): string | null {
    return this.#validate(this.value)
  }

  get invalid(): boolean {
    return this.error !== null
  }

  get showError(): boolean {
    return this.touched && this.invalid
  }

  readonly onblur = () => {
    this.touched = true
  }

  /**
   * Restores the initial value and untouched state — for emptying a form
   * after a successful submit without the cleared fields lighting up as
   * invalid (submit handlers mark fields touched before validating).
   */
  readonly reset = () => {
    this.value = this.#initial
    this.touched = false
  }
}

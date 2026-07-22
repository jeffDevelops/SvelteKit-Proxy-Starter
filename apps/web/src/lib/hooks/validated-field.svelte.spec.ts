import { describe, expect, it } from 'vitest'
import { ValidatedField } from './validated-field.svelte'

const notEmpty = (value: string) => (value.trim() ? null : 'Required')

describe('ValidatedField', () => {
  it('starts untouched', () => {
    const field = new ValidatedField('', notEmpty)
    expect(field.touched).toBe(false)
  })

  it('does not show an error before the field has been touched, even if invalid', () => {
    const field = new ValidatedField('', notEmpty)
    expect(field.invalid).toBe(true)
    expect(field.showError).toBe(false)
  })

  it('marks the field as touched onblur', () => {
    const field = new ValidatedField('', notEmpty)
    field.onblur()
    expect(field.touched).toBe(true)
  })

  it('shows the error once touched and invalid', () => {
    const field = new ValidatedField('', notEmpty)
    field.onblur()
    expect(field.showError).toBe(true)
    expect(field.error).toBe('Required')
  })

  it('never shows an error for a value that is already valid', () => {
    const field = new ValidatedField('hello', notEmpty)
    field.onblur()
    expect(field.showError).toBe(false)
    expect(field.error).toBeNull()
  })

  it('hides the error once the value becomes valid, without needing to blur again', () => {
    const field = new ValidatedField('', notEmpty)
    field.onblur()
    expect(field.showError).toBe(true)

    field.value = 'hello'
    expect(field.showError).toBe(false)
    expect(field.error).toBeNull()
  })

  it('re-shows the error if a touched field becomes invalid again', () => {
    const field = new ValidatedField('hello', notEmpty)
    field.onblur()
    expect(field.showError).toBe(false)

    field.value = '   '
    expect(field.showError).toBe(true)
  })

  it('reset restores the initial value and clears the touched state', () => {
    const field = new ValidatedField('', notEmpty)
    field.value = 'hello'
    field.onblur()

    field.reset()
    expect(field.value).toBe('')
    expect(field.touched).toBe(false)
    expect(field.showError).toBe(false)
  })

  it('reset restores a non-empty initial value too', () => {
    const field = new ValidatedField('initial', notEmpty)
    field.value = 'edited'
    field.onblur()

    field.reset()
    expect(field.value).toBe('initial')
    expect(field.touched).toBe(false)
  })
})

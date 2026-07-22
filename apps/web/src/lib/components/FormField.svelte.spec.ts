import { page } from 'vitest/browser'
import FormField from './FormField.svelte'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { ValidatedField } from '$lib/hooks/validated-field.svelte'

const REQUIRED = 'This field is required'
const makeField = () => new ValidatedField('', (value) => (value ? null : REQUIRED))

describe('FormField', () => {
  it('associates the label with the input and forwards input attributes', async () => {
    render(FormField, {
      props: {
        id: 'email',
        label: 'Email',
        field: makeField(),
        type: 'email',
        required: true,
        autocomplete: 'email',
      },
    })

    const input = page.getByLabelText('Email')
    await expect.element(input).toBeInTheDocument()
    await expect.element(input).toHaveAttribute('type', 'email')
    await expect.element(input).toHaveAttribute('required', '')
    await expect.element(input).toHaveAttribute('autocomplete', 'email')
  })

  it('stays quiet before the field is blurred, even when invalid', async () => {
    render(FormField, { props: { id: 'name', label: 'Name', field: makeField() } })

    await expect.element(page.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'false')
    expect(page.getByText(REQUIRED).elements()).toHaveLength(0)
  })

  it('surfaces the error with aria wiring after blur', async () => {
    render(FormField, { props: { id: 'name', label: 'Name', field: makeField() } })

    const input = page.getByLabelText('Name')
    input.element().dispatchEvent(new FocusEvent('blur'))

    await expect.element(page.getByText(REQUIRED)).toBeInTheDocument()
    await expect.element(input).toHaveAttribute('aria-invalid', 'true')
    await expect.element(input).toHaveAttribute('aria-describedby', 'name-error')
    await expect.element(page.getByText(REQUIRED)).toHaveAttribute('id', 'name-error')
  })

  it('binds typed input back to the ValidatedField', async () => {
    const field = makeField()
    render(FormField, { props: { id: 'name', label: 'Name', field } })

    await page.getByLabelText('Name').fill('kalman')
    expect(field.value).toBe('kalman')
  })
})

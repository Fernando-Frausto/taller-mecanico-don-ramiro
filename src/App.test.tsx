import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the workshop title', () => {
    render(<App />)
    expect(screen.getByText(/Taller Mecánico Don Ramiro/i)).toBeInTheDocument()
  })
})

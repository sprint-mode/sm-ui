import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import {
  Card, CardBody, Pill, Badge, Button,
  StatCard, Stats, Progress, Empty, Spinner,
} from '../components.tsx'

// ── Card ─────────────────────────────────────────────────────────────────────

describe('Card', function() {
  it('renders children', function() {
    render(<Card>Hello card</Card>)
    expect(screen.getByText('Hello card')).toBeInTheDocument()
  })

  it('applies sm-card class', function() {
    const { container } = render(<Card>x</Card>)
    expect(container.firstChild).toHaveClass('sm-card')
  })

  it('merges extra className', function() {
    const { container } = render(<Card className="extra">x</Card>)
    expect(container.firstChild).toHaveClass('sm-card', 'extra')
  })

  it('applies accent border style', function() {
    const { container } = render(<Card accent="#ff0000">x</Card>)
    expect(container.firstChild.style.borderColor).toBe('rgb(255, 0, 0)')
  })
})

// ── CardBody ─────────────────────────────────────────────────────────────────

describe('CardBody', function() {
  it('renders children', function() {
    render(<CardBody>body content</CardBody>)
    expect(screen.getByText('body content')).toBeInTheDocument()
  })

  it('applies sm-card-body class', function() {
    const { container } = render(<CardBody>x</CardBody>)
    expect(container.firstChild).toHaveClass('sm-card-body')
  })
})

// ── Pill ─────────────────────────────────────────────────────────────────────

describe('Pill', function() {
  it('renders children', function() {
    render(<Pill>Active</Pill>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('defaults to gray color class', function() {
    const { container } = render(<Pill>x</Pill>)
    expect(container.firstChild).toHaveClass('sm-pill-gray')
  })

  it('applies given color class', function() {
    const { container } = render(<Pill color="green">x</Pill>)
    expect(container.firstChild).toHaveClass('sm-pill-green')
  })
})

// ── Badge ─────────────────────────────────────────────────────────────────────

describe('Badge', function() {
  it('renders children', function() {
    render(<Badge>3</Badge>)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('defaults to gray color class', function() {
    const { container } = render(<Badge>x</Badge>)
    expect(container.firstChild).toHaveClass('sm-badge-gray')
  })

  it('applies given color class', function() {
    const { container } = render(<Badge color="red">x</Badge>)
    expect(container.firstChild).toHaveClass('sm-badge-red')
  })
})

// ── Button ───────────────────────────────────────────────────────────────────

describe('Button', function() {
  it('renders children', function() {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('defaults to secondary variant', function() {
    const { container } = render(<Button>x</Button>)
    expect(container.firstChild).toHaveClass('sm-btn-secondary')
  })

  it('applies primary variant', function() {
    const { container } = render(<Button variant="primary">x</Button>)
    expect(container.firstChild).toHaveClass('sm-btn-primary')
  })

  it('applies danger variant', function() {
    const { container } = render(<Button variant="danger">x</Button>)
    expect(container.firstChild).toHaveClass('sm-btn-danger')
  })

  it('applies sm size class', function() {
    const { container } = render(<Button size="sm">x</Button>)
    expect(container.firstChild).toHaveClass('sm-btn-sm')
  })

  it('applies lg size class', function() {
    const { container } = render(<Button size="lg">x</Button>)
    expect(container.firstChild).toHaveClass('sm-btn-lg')
  })

  it('fires onClick', async function() {
    const fn = vi.fn()
    render(<Button onClick={fn}>Go</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('renders an anchor when href is given', function() {
    render(<Button href="/foo">Link</Button>)
    expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute('href', '/foo')
  })

  it('is disabled when disabled prop is set', function() {
    render(<Button disabled>x</Button>)
    expect(screen.getByRole('button', { name: 'x' })).toBeDisabled()
  })
})

// ── StatCard ─────────────────────────────────────────────────────────────────

describe('StatCard', function() {
  it('renders label and value', function() {
    render(<StatCard label="Revenue" value="$1,200" />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$1,200')).toBeInTheDocument()
  })

  it('renders sub text when provided', function() {
    render(<StatCard label="x" value="0" sub="vs last month" />)
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  it('does not render sub element when omitted', function() {
    const { container } = render(<StatCard label="x" value="0" />)
    expect(container.querySelector('.sm-stat-sub')).toBeNull()
  })
})

// ── Stats ────────────────────────────────────────────────────────────────────

describe('Stats', function() {
  it('renders children inside sm-stats container', function() {
    const { container } = render(<Stats><span>child</span></Stats>)
    expect(container.firstChild).toHaveClass('sm-stats')
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})

// ── Progress ─────────────────────────────────────────────────────────────────

describe('Progress', function() {
  it('renders progress fill with correct width', function() {
    const { container } = render(<Progress value={75} />)
    const fill = container.querySelector('.sm-progress-fill')
    expect(fill).toBeInTheDocument()
    expect(fill.style.width).toBe('75%')
  })

  it('defaults value to 0 when not provided', function() {
    const { container } = render(<Progress />)
    const fill = container.querySelector('.sm-progress-fill')
    expect(fill.style.width).toBe('0%')
  })
})

// ── Empty ────────────────────────────────────────────────────────────────────

describe('Empty', function() {
  it('renders title and message', function() {
    render(<Empty title="Nothing here" message="Add something to get started." />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.getByText('Add something to get started.')).toBeInTheDocument()
  })

  it('renders without crashing when no props', function() {
    const { container } = render(<Empty />)
    expect(container.firstChild).toHaveClass('sm-empty')
  })
})

// ── Spinner ───────────────────────────────────────────────────────────────────

describe('Spinner', function() {
  it('renders without crashing', function() {
    const { container } = render(<Spinner />)
    expect(container.querySelector('.spinner')).toBeInTheDocument()
  })
})

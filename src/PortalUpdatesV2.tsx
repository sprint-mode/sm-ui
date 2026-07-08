import React, { useState, useEffect, useCallback, useRef } from 'react'
import { UpdateAttachments, Attachment } from './UpdateAttachments.tsx'
import { InboxRow, CategoryPill } from './InboxRow.tsx'
import type { InboxItem } from './InboxRow.tsx'

// ─── Types ──────────────────────────────────────────────────────────────────────

interface UpdateItem {
  id: string
  title: string
  body?: string
  update_type?: string
  comm_type?: string
  published_at?: string
  author_name?: string
  read_at?: string
  notification_type?: string
  priority?: string
  source_system?: string
  action_url?: string
  action_label?: string
  attachments?: Attachment[] | string | null
  thread_id?: string
}

interface TaskItem {
  id: string
  title: string
  task_type?: string
  status?: string
  priority?: string
  company_name?: string
  company_id?: string
  contact_name?: string
  contact_id?: string
  due_date?: string
  product?: string
  created_at?: string
}

interface SupportThread {
  id: string
  subject?: string
  status?: string
  message_count?: number
  last_message?: string
  last_role?: string
  created_at?: string
  updated_at?: string
  request_status?: string
  product?: string
  contact_name?: string
  contact_email?: string
  contact_id?: string
  company_id?: string
}

interface SupportMessage {
  id: string
  role: string
  content: string
  created_at?: string
  attachments?: string | Attachment[] | null
}

interface AdminThreadDetail {
  thread: SupportThread & Record<string, unknown>
  messages: SupportMessage[]
  context?: {
    contact?: Record<string, unknown>
    company?: Record<string, unknown>
    engagement?: Record<string, unknown>
  }
}

type SectionId = 'feed' | 'tasks' | 'support'

export interface PortalUpdatesV2Props {
  api: (path: string, opts?: Record<string, unknown>) => Promise<Record<string, unknown>>
  subdomain?: string
  title?: string
  subtitle?: string
  shortcutKey?: string
  userContactId?: string
  onNavigate?: (path: string) => void
}

// ─── Category system ────────────────────────────────────────────────────────────

var CATEGORY_PILLS: Record<string, CategoryPill> = {
  lead:       { label: 'Lead',      bg: '#E1F5EE', color: '#0F6E56' },
  contract:   { label: 'Contract',  bg: '#EEEDFE', color: '#3C3489' },
  screening:  { label: 'Screening', bg: '#E6F1FB', color: '#0C447C' },
  signal:     { label: 'Signal',    bg: 'hsla(340,55%,47%,.1)', color: 'hsl(340,55%,47%)' },
  mode:       { label: 'Mode',      bg: 'hsla(160,84%,39%,.1)', color: 'hsl(160,84%,39%)' },
  support:    { label: 'Support',   bg: '#FAEEDA', color: '#633806' },
  alert:      { label: 'Alert',     bg: '#FCEBEB', color: '#791F1F' },
  platform:   { label: 'Platform',  bg: '#E6F1FB', color: '#0C447C' },
  people:     { label: 'People',    bg: '#EEEDFE', color: '#3C3489' },
  finance:    { label: 'Finance',   bg: '#FAEEDA', color: '#633806' },
  bug:        { label: 'Bug',       bg: '#FCEBEB', color: '#791F1F' },
  update:     { label: 'Update',    bg: '#EAF3DE', color: '#27500A' },
  ai_weekly:  { label: 'AI Weekly', bg: '#EEEDFE', color: '#3C3489' },
  sprint:     { label: 'Sprint',    bg: '#EEEDFE', color: '#3C3489' },
  milestone:  { label: 'Milestone', bg: '#EAF3DE', color: '#27500A' },
  announce:   { label: 'Announce',  bg: '#E6F1FB', color: '#0C447C' },
  flash:      { label: 'Flash',     bg: '#FCEBEB', color: '#791F1F' },
  board:      { label: 'Board',     bg: '#E6F1FB', color: '#0C447C' },
  policy:     { label: 'Policy',    bg: '#FAEEDA', color: '#633806' },
  culture:    { label: 'Culture',   bg: '#E1F5EE', color: '#085041' },
  task:       { label: 'Task',      bg: '#E6F1FB', color: '#0C447C' },
  test:       { label: 'Test',      bg: '#f3f4f6', color: '#6b7280' },
  general:    { label: 'General',   bg: '#f3f4f6', color: '#6b7280' },
}

function getCategory(item: UpdateItem): string {
  var nt = item.notification_type || ''
  var ct = item.comm_type || ''
  var ut = item.update_type || ''

  // notification_type overrides
  if (nt === 'sales' || nt === 'lead_submitted' || nt === 'lead_reply' || nt === 'lead_interested') return 'lead'
  if (nt === 'contract_sent' || nt === 'contract_signed' || nt === 'contract_declined') return 'contract'
  if (nt === 'screening_scheduled') return 'screening'
  if (nt === 'signal_anomaly') return 'signal'
  if (nt === 'mode_scan_complete') return 'mode'
  if (nt === 'chat_escalated' || nt === 'support_reply') return 'support'
  if (nt === 'guardrail_flag') return 'alert'
  if (nt.indexOf('portal_') === 0) return 'platform'
  if (nt.indexOf('deel_') === 0) return 'people'
  if (nt === 'payment_failed' || nt === 'invoice_overdue') return 'finance'
  if (nt === 'action_item_assigned') return 'task'
  if (nt === 'team_update_published') return 'update'
  if (nt === 'push_test') return 'test'

  // comm_type fallback
  if (ct === 'bug_comment') return 'bug'

  // update_type fallback for content updates
  if (ut === 'ai_weekly') return 'ai_weekly'
  if (ut === 'sprint_report') return 'sprint'
  if (ut === 'milestone') return 'milestone'
  if (ut === 'announcement') return 'announce'
  if (ut === 'flash_update') return 'flash'
  if (ut === 'board_update') return 'board'
  if (ut === 'policy') return 'policy'
  if (ut === 'culture') return 'culture'

  return 'general'
}

// Navigate-type categories: clicking the row navigates away
var _NAVIGATE_CATEGORIES = new Set(['lead', 'contract', 'screening', 'signal', 'mode', 'bug', 'alert', 'platform', 'people', 'finance', 'task'])

// Expand-type categories: clicking the row expands body + attachments inline
var EXPAND_CATEGORIES = new Set(['support', 'update', 'ai_weekly', 'sprint', 'milestone', 'announce', 'flash', 'board', 'policy', 'culture', 'general', 'test'])

// ─── Helpers ────────────────────────────────────────────────────────────────────

function relativeTime(iso: string | undefined): string {
  if (!iso) return ''
  var diff = Date.now() - new Date(iso).getTime()
  var m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return m + 'm ago'
  var h = Math.floor(m / 60)
  if (h < 24) return h + 'h ago'
  var d = Math.floor(h / 24)
  if (d < 30) return d + 'd ago'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(iso: string | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
      background: bg, color: color, whiteSpace: 'nowrap', flexShrink: 0,
    }}>{label}</span>
  )
}

function PriorityPill({ priority }: { priority: string | undefined }) {
  var PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
    critical: { bg: '#FCEBEB', color: '#791F1F' },
    high: { bg: '#FCEBEB', color: '#791F1F' },
    normal: { bg: '#f3f4f6', color: '#6b7280' },
    low: { bg: '#f3f4f6', color: '#9ca3af' },
  }
  var p = priority || 'normal'
  var c = PRIORITY_COLORS[p] || PRIORITY_COLORS.normal
  return <Pill label={p} bg={c.bg} color={c.color} />
}

function StatusPill({ status }: { status: string | undefined }) {
  var STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    open: { bg: '#E6F1FB', color: '#0C447C' },
    completed: { bg: '#EAF3DE', color: '#27500A' },
    active: { bg: '#EAF3DE', color: '#27500A' },
    resolved: { bg: '#f3f4f6', color: '#6b7280' },
    closed: { bg: '#f3f4f6', color: '#6b7280' },
    escalated: { bg: '#FCEBEB', color: '#791F1F' },
  }
  var s = status || 'open'
  var c = STATUS_COLORS[s] || STATUS_COLORS.open
  return <Pill label={s} bg={c.bg} color={c.color} />
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 24px',
      border: '1px solid var(--border, #e5e7eb)', borderRadius: 'var(--radius, 8px)',
      color: 'var(--muted, var(--text-3, #9ca3af))',
    }}>
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  )
}

function FilterRow({ children, count, countLabel }: { children: React.ReactNode; count: number; countLabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {children}
      <span style={{ fontSize: 12, color: 'var(--muted, var(--text-3, #9ca3af))', marginLeft: 'auto' }}>
        {count} {countLabel}{count !== 1 ? 's' : ''}
      </span>
    </div>
  )
}

function SelectFilter({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={function(e) { onChange(e.target.value) }}
      style={{
        fontSize: 12, padding: '4px 8px',
        border: '1px solid var(--border, #e5e7eb)', borderRadius: 6,
        background: 'var(--bg-0, transparent)', color: 'var(--text-1, #111)',
        cursor: 'pointer',
      }}
    >
      {options.map(function(o) { return <option key={o.value} value={o.value}>{o.label}</option> })}
    </select>
  )
}

// ─── Filter bar ─────────────────────────────────────────────────────────────────

interface FilterBarProps {
  readFilter: 'all' | 'unread'
  onReadFilterChange: (v: 'all' | 'unread') => void
  categories: { key: string; label: string; unreadCount: number; bg: string; color: string }[]
  selectedCategories: Set<string>
  onCategoryToggle: (key: string) => void
}

function FilterBar({ readFilter, onReadFilterChange, categories, selectedCategories, onCategoryToggle }: FilterBarProps) {
  var pillBase: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
    cursor: 'pointer', border: 'none', fontFamily: 'inherit',
    textTransform: 'uppercase', letterSpacing: '.3px',
    transition: 'background .12s, color .12s, box-shadow .12s',
    display: 'inline-flex', alignItems: 'center', gap: 5,
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
      {/* Section 1: All / Unread — mutually exclusive */}
      <button
        onClick={function() { onReadFilterChange('all') }}
        style={Object.assign({}, pillBase, {
          background: readFilter === 'all' ? 'var(--accent, var(--blue, #2362ea))' : 'var(--bg-subtle, #f3f4f6)',
          color: readFilter === 'all' ? '#fff' : 'var(--muted, #6b7280)',
        })}
      >All</button>
      <button
        onClick={function() { onReadFilterChange('unread') }}
        style={Object.assign({}, pillBase, {
          background: readFilter === 'unread' ? 'var(--accent, var(--blue, #2362ea))' : 'var(--bg-subtle, #f3f4f6)',
          color: readFilter === 'unread' ? '#fff' : 'var(--muted, #6b7280)',
        })}
      >Unread</button>

      {/* Divider */}
      {categories.length > 0 && (
        <span style={{ width: 1, height: 16, background: 'var(--border, #e5e7eb)', flexShrink: 0 }} />
      )}

      {/* Section 2: Category chips — multi-select */}
      {categories.map(function(cat) {
        var isSelected = selectedCategories.has(cat.key)
        return (
          <button
            key={cat.key}
            onClick={function() { onCategoryToggle(cat.key) }}
            style={Object.assign({}, pillBase, {
              background: isSelected ? cat.bg : 'var(--bg-subtle, #f3f4f6)',
              color: isSelected ? cat.color : 'var(--muted, #6b7280)',
              boxShadow: isSelected ? 'inset 0 0 0 1px ' + cat.color + '33' : 'none',
            })}
          >
            {cat.label}
            {cat.unreadCount > 0 && (
              <span style={{
                fontSize: 9, fontWeight: 700,
                minWidth: 14, height: 14, borderRadius: 7,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: isSelected ? cat.color : 'var(--muted, #9ca3af)',
                color: '#fff', padding: '0 4px',
              }}>{cat.unreadCount}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Feed section ───────────────────────────────────────────────────────────────

function FeedSection({ items, api, onNavigate, isTeam, subdomain }: {
  items: UpdateItem[]
  api: PortalUpdatesV2Props['api']
  onNavigate?: (path: string) => void
  isTeam?: boolean
  subdomain?: string
}) {
  var [readFilter, setReadFilter] = useState<'all' | 'unread'>('all')
  var [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  var [expandedId, setExpandedId] = useState<string | null>(null)

  // Support thread inline state
  var [threadDetail, setThreadDetail] = useState<AdminThreadDetail | null>(null)
  var [threadLoading, setThreadLoading] = useState(false)
  var [replyText, setReplyText] = useState('')
  var [sending, setSending] = useState(false)
  var [threadAttachments, setThreadAttachments] = useState<Attachment[]>([])
  var [uploading, setUploading] = useState(false)
  var fileInputRef = useRef<HTMLInputElement>(null)

  // Build category list from items in the feed
  var categoryMap = new Map<string, { unreadCount: number }>()
  items.forEach(function(item) {
    var cat = getCategory(item)
    var entry = categoryMap.get(cat)
    if (!entry) {
      entry = { unreadCount: 0 }
      categoryMap.set(cat, entry)
    }
    if (!item.read_at) entry.unreadCount++
  })

  var categoryChips = Array.from(categoryMap.entries())
    .map(function(e) {
      var pill = CATEGORY_PILLS[e[0]] || CATEGORY_PILLS.general
      return { key: e[0], label: pill.label, bg: pill.bg, color: pill.color, unreadCount: e[1].unreadCount }
    })
    .sort(function(a, b) { return b.unreadCount - a.unreadCount })

  function toggleCategory(key: string) {
    setSelectedCategories(function(prev) {
      var next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Apply filters
  var filtered = items.filter(function(item) {
    if (readFilter === 'unread' && item.read_at) return false
    if (selectedCategories.size > 0) {
      var cat = getCategory(item)
      if (!selectedCategories.has(cat)) return false
    }
    return true
  })

  function handleRead(id: string) {
    api('/api/notifications/' + id + '/read', { method: 'POST' }).catch(function() {})
  }

  function getSignedUrl(updateId: string, attId: string) {
    return api('/api/updates/' + updateId + '/attachments/' + attId + '/url') as Promise<{ url?: string; data?: { url?: string } }>
  }

  function getThreadSignedUrl(_updateId: string, attId: string) {
    if (!expandedId) return Promise.resolve({} as { url?: string; data?: { url?: string } })
    var expandedItem = items.find(function(i) { return i.id === expandedId })
    var tid = expandedItem?.thread_id
    if (!tid) return Promise.resolve({} as { url?: string; data?: { url?: string } })
    if (isTeam) {
      return api('/api/support/threads/' + tid + '/attachments/' + attId + '/url') as Promise<{ url?: string; data?: { url?: string } }>
    }
    if (subdomain) {
      return api('/api/portals/' + subdomain + '/support/threads/' + tid + '/attachments/' + attId + '/url') as Promise<{ url?: string; data?: { url?: string } }>
    }
    return Promise.resolve({} as { url?: string; data?: { url?: string } })
  }

  function loadSupportThread(threadId: string) {
    setThreadLoading(true)
    setThreadDetail(null)
    var endpoint = isTeam
      ? '/api/support/threads/' + threadId
      : subdomain
        ? '/api/portals/' + subdomain + '/support/threads/' + threadId
        : null
    if (!endpoint) { setThreadLoading(false); return }
    api(endpoint).then(function(res) {
      if (res.ok) {
        // Admin endpoint returns { thread, messages, context }
        // Portal endpoint returns { messages } or similar
        var data = res.data as AdminThreadDetail | { messages?: SupportMessage[] }
        if ('thread' in data) {
          setThreadDetail(data as AdminThreadDetail)
        } else {
          // Wrap portal response into AdminThreadDetail shape
          setThreadDetail({ thread: {} as AdminThreadDetail['thread'], messages: (data as { messages?: SupportMessage[] }).messages || [], context: undefined })
        }
      }
      setThreadLoading(false)
    }).catch(function() { setThreadLoading(false) })
  }

  function sendSupportReply(threadId: string) {
    if (!replyText.trim() || sending) return
    setSending(true)
    var endpoint = isTeam
      ? '/api/support/threads/' + threadId + '/reply'
      : subdomain
        ? '/api/portals/' + subdomain + '/support/threads/' + threadId + '/reply'
        : null
    if (!endpoint) { setSending(false); return }
    api(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText.trim(), attachments: threadAttachments.length > 0 ? JSON.stringify(threadAttachments) : undefined }),
    }).then(function() {
      setReplyText(''); setThreadAttachments([]); setSending(false)
      loadSupportThread(threadId)
    }).catch(function() { setSending(false) })
  }

  function uploadThreadFile(file: File, threadId: string) {
    if (uploading) return
    setUploading(true)
    var fd = new FormData(); fd.append('file', file)
    var endpoint = isTeam
      ? '/api/support/threads/' + threadId + '/attachments'
      : subdomain
        ? '/api/portals/' + subdomain + '/support/threads/' + threadId + '/attachments'
        : null
    if (!endpoint) { setUploading(false); return }
    fetch(endpoint, { method: 'POST', credentials: 'include', body: fd })
      .then(function(r) { return r.json() })
      .then(function(res: Record<string, unknown>) {
        if (res.ok && res.data) {
          var att = (res.data as Record<string, unknown>).attachment as Attachment
          setThreadAttachments(function(prev) { return prev.concat(att) })
        }
        setUploading(false)
      }).catch(function() { setUploading(false) })
  }

  function handleItemClick(item: UpdateItem) {
    var cat = getCategory(item)
    handleRead(item.id)

    // Support items with thread_id: expand inline with thread detail
    if (cat === 'support' && item.thread_id) {
      if (expandedId === item.id) {
        setExpandedId(null)
        setThreadDetail(null)
        setReplyText(''); setThreadAttachments([])
      } else {
        setExpandedId(item.id)
        loadSupportThread(item.thread_id)
        setReplyText(''); setThreadAttachments([])
      }
      return
    }

    if (EXPAND_CATEGORIES.has(cat)) {
      setExpandedId(function(prev) { return prev === item.id ? null : item.id })
      setThreadDetail(null)
    } else if (item.action_url && onNavigate) {
      onNavigate(item.action_url)
    }
  }

  return (
    <div>
      <FilterBar
        readFilter={readFilter}
        onReadFilterChange={setReadFilter}
        categories={categoryChips}
        selectedCategories={selectedCategories}
        onCategoryToggle={toggleCategory}
      />
      {filtered.length === 0 ? (
        <EmptyState message={readFilter === 'unread' ? 'No unread items' : 'No updates yet'} />
      ) : (
        <div style={{ border: '1px solid var(--border, #e5e7eb)', borderRadius: 'var(--radius, 8px)', overflow: 'hidden' }}>
          {filtered.map(function(item) {
            var cat = getCategory(item)
            var pill = CATEGORY_PILLS[cat] || CATEGORY_PILLS.general
            var isExpanded = expandedId === item.id
            var isSupportThread = cat === 'support' && item.thread_id && isExpanded

            var expandedContent: React.ReactNode = null
            if (isExpanded && isSupportThread) {
              // ── Inline support thread ──────────────────────────────────────
              expandedContent = (
                <div>
                  {threadLoading && !threadDetail ? (
                    <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: 'var(--muted, #9ca3af)' }}>Loading thread...</div>
                  ) : threadDetail ? (
                    <div>
                      {/* Context bar (admin only) */}
                      {threadDetail.context?.company && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                          <span onClick={function() { if (onNavigate) onNavigate('/crm/' + String((threadDetail!.context!.company as Record<string, unknown>).id)) }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--bg-subtle, #f3f4f6)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 99, fontSize: 11, color: 'var(--accent, #7c5cbf)', cursor: 'pointer' }}>
                            {String((threadDetail.context.company as Record<string, unknown>).name || 'Company')}
                          </span>
                        </div>
                      )}
                      {/* Messages */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                        {(threadDetail.messages || []).map(function(msg) {
                          var isUser = msg.role === 'user'
                          var isBot = msg.role === 'assistant'
                          var isHuman = msg.role === 'human'
                          if (!isUser && !isBot && !isHuman) {
                            return <div key={msg.id} style={{ display: 'flex', justifyContent: 'center' }}>
                              <span style={{ padding: '3px 12px', background: 'var(--bg-subtle, #f3f4f6)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 99, fontSize: 11, color: 'var(--muted, #6b7280)' }}>{msg.content}</span>
                            </div>
                          }
                          return (
                            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                              {!isUser && <div style={{ fontSize: 11, color: isHuman ? 'var(--accent, #7c5cbf)' : 'var(--muted, #9ca3af)', marginBottom: 4 }}>
                                {isBot ? 'AI · Support' : 'Team'}
                              </div>}
                              <div style={{
                                maxWidth: '85%', padding: '8px 12px', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                                borderRadius: 10,
                                borderBottomRightRadius: isUser ? 3 : 10,
                                borderBottomLeftRadius: !isUser ? 3 : 10,
                                background: isUser ? 'var(--accent, #7c5cbf)' : isHuman ? 'var(--accent-soft, #EEEDFE)' : 'var(--bg-0, transparent)',
                                color: isUser ? '#fff' : isHuman ? 'var(--accent, #7c5cbf)' : 'var(--foreground, inherit)',
                                border: isHuman ? '1px solid hsla(262,60%,55%,.2)' : isUser ? 'none' : '1px solid var(--border, #e5e7eb)',
                                marginLeft: isUser ? 'auto' : 0, marginRight: isUser ? 0 : 'auto',
                              }}>{msg.content}</div>
                              {msg.attachments && (
                                <div style={{ maxWidth: '85%', marginLeft: isUser ? 'auto' : 0 }}>
                                  <UpdateAttachments attachments={msg.attachments} updateId={item.thread_id || item.id} getSignedUrl={getThreadSignedUrl} compact />
                                </div>
                              )}
                              <div style={{ fontSize: 10, color: 'var(--muted, #9ca3af)', marginTop: 3, padding: '0 2px' }}>{relativeTime(msg.created_at)}</div>
                            </div>
                          )
                        })}
                      </div>
                      {/* Reply bar */}
                      <div style={{ borderTop: '1px solid var(--border, #e5e7eb)', paddingTop: 8 }}
                        onDragOver={function(e) { e.preventDefault() }}
                        onDrop={function(e) { e.preventDefault(); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f && item.thread_id) uploadThreadFile(f, item.thread_id) }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <button onClick={function() { fileInputRef.current && fileInputRef.current.click() }} disabled={uploading} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: uploading ? 'default' : 'pointer',
                            border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-0, transparent)',
                            color: 'var(--muted, #6b7280)', fontFamily: 'inherit', opacity: uploading ? 0.5 : 1,
                          }}>{uploading ? 'Uploading...' : 'Attach file'}</button>
                          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={function(e) {
                            var f = e.target.files && e.target.files[0]
                            if (f && item.thread_id) uploadThreadFile(f, item.thread_id)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }} accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.mp4,.mov" />
                        </div>
                        {threadAttachments.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                            {threadAttachments.map(function(att) {
                              return <span key={att.id} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, fontSize: 11,
                                border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-subtle, #f9fafb)', color: 'var(--foreground, #374151)',
                              }}>
                                {att.filename || att.id}
                                <span onClick={function() { setThreadAttachments(function(prev) { return prev.filter(function(a) { return a.id !== att.id }) }) }}
                                  style={{ cursor: 'pointer', color: 'var(--muted, #9ca3af)', fontSize: 13, lineHeight: 1 }}>x</span>
                              </span>
                            })}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" value={replyText} onChange={function(e) { setReplyText(e.target.value) }}
                            onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey && item.thread_id) sendSupportReply(item.thread_id) }}
                            placeholder="Reply to this thread..." disabled={sending}
                            style={{ flex: 1, fontSize: 13, padding: '8px 10px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 6, background: 'var(--bg-0, transparent)', color: 'var(--foreground, #111)', fontFamily: 'inherit' }}
                          />
                          <button onClick={function() { if (item.thread_id) sendSupportReply(item.thread_id) }} disabled={sending || !replyText.trim()} style={{
                            padding: '6px 14px', borderRadius: 6, border: 'none',
                            background: 'var(--accent, #7c5cbf)', color: '#fff', fontSize: 12, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit', opacity: sending || !replyText.trim() ? 0.5 : 1,
                          }}>Send</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--muted, #9ca3af)', padding: '8px 0' }}>Thread not found</div>
                  )}
                  <button onClick={function(e) { e.stopPropagation(); setExpandedId(null); setThreadDetail(null); setReplyText(''); setThreadAttachments([]) }}
                    style={{ fontSize: 11, color: 'var(--muted, var(--text-3, #9ca3af))', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'inherit', marginTop: 4 }}>
                    Collapse
                  </button>
                </div>
              )
            } else if (isExpanded) {
              // ── Standard expand (body + attachments) ───────────────────────
              expandedContent = (
                <div>
                  {item.body && (
                    <div style={{
                      fontSize: 13, lineHeight: 1.6,
                      color: 'var(--foreground, var(--text-1, #374151))',
                      whiteSpace: 'pre-wrap', marginBottom: 8,
                    }}>{item.body}</div>
                  )}
                  <UpdateAttachments
                    attachments={item.attachments}
                    updateId={item.id}
                    getSignedUrl={getSignedUrl}
                  />
                  <button
                    onClick={function(e) { e.stopPropagation(); setExpandedId(null) }}
                    style={{
                      fontSize: 11, color: 'var(--muted, var(--text-3, #9ca3af))',
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px 0', fontFamily: 'inherit', marginTop: 4,
                    }}
                  >Collapse</button>
                </div>
              )
            }

            return (
              <InboxRow
                key={item.id}
                item={item as InboxItem}
                category={pill}
                onClick={function() { handleItemClick(item) }}
                expanded={isExpanded}
                expandedContent={expandedContent}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Tasks section (preserved from original) ───────────────────────────────────

function TasksSection({ items, api, onNavigate }: { items: TaskItem[]; api: PortalUpdatesV2Props['api']; onNavigate?: (path: string) => void }) {
  var [statusFilter, setStatusFilter] = useState('all')
  var [completing, setCompleting] = useState<string | null>(null)
  var [localItems, setLocalItems] = useState(items)

  useEffect(function() { setLocalItems(items) }, [items])

  var filtered = localItems.filter(function(i) {
    if (statusFilter !== 'all') return i.status === statusFilter
    return true
  })

  function markComplete(e: React.MouseEvent, taskId: string) {
    e.stopPropagation()
    setCompleting(taskId)
    api('/api/tasks/' + taskId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    }).then(function() {
      setLocalItems(function(prev) {
        return prev.map(function(t) { return t.id === taskId ? Object.assign({}, t, { status: 'completed' }) : t })
      })
      setCompleting(null)
    }).catch(function() { setCompleting(null) })
  }

  function handleRowClick(item: TaskItem) {
    if (!onNavigate) return
    if (item.company_id) onNavigate('/crm/' + item.company_id + '?tab=tasks')
    else if (item.contact_id) onNavigate('/crm/contacts/' + item.contact_id + '?tab=tasks')
  }

  return (
    <div>
      <FilterRow count={filtered.length} countLabel="task">
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'all', label: 'All statuses' },
          { value: 'open', label: 'Open' },
          { value: 'completed', label: 'Completed' },
        ]} />
      </FilterRow>
      {filtered.length === 0 ? <EmptyState message="No tasks assigned" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {filtered.map(function(item) {
            var isDone = item.status === 'completed'
            var isCompleting = completing === item.id
            return (
              <div key={item.id} onClick={function() { handleRowClick(item) }} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid var(--border, #e5e7eb)',
                cursor: onNavigate ? 'pointer' : 'default',
                transition: 'background .1s',
              }}>
                <div onClick={function(e) { if (!isDone && !isCompleting) markComplete(e, item.id) }} style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: isDone ? '1.5px solid #639922' : '1.5px solid var(--border-2, #d1d5db)',
                  background: isDone ? '#EAF3DE' : 'var(--bg-0, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: isDone ? 'default' : 'pointer',
                  opacity: isCompleting ? 0.5 : 1,
                }}>
                  {isDone && <span style={{ fontSize: 12, color: '#639922' }}>&#10003;</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 13, fontWeight: 400,
                      color: isDone ? 'var(--muted, var(--text-3, #9ca3af))' : 'var(--foreground, var(--text-0, inherit))',
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>{item.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted, var(--text-3, #9ca3af))' }}>
                    {item.company_name ? item.company_name + ' · ' : ''}
                    {(item.task_type || '').replace(/_/g, ' ')}
                    {item.due_date ? ' · Due ' + formatDate(item.due_date) : ''}
                  </div>
                </div>
                <StatusPill status={item.status} />
                <PriorityPill priority={item.priority} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Portal support section (client/investor — preserved from original) ──────

function SupportSectionPortal({ threads, api, subdomain }: { threads: SupportThread[]; api: PortalUpdatesV2Props['api']; subdomain: string }) {
  var [statusFilter, setStatusFilter] = useState('all')
  var [expandedId, setExpandedId] = useState<string | null>(null)
  var [messages, setMessages] = useState<SupportMessage[]>([])
  var [loadingMessages, setLoadingMessages] = useState(false)
  var [replyText, setReplyText] = useState('')
  var [sending, setSending] = useState(false)
  var [queuedAttachments, setQueuedAttachments] = useState<Attachment[]>([])
  var [uploading, setUploading] = useState(false)
  var fileInputRef = useRef<HTMLInputElement>(null)

  var filtered = threads.filter(function(t) {
    if (statusFilter === 'active') return t.status === 'active' || t.status === 'escalated'
    if (statusFilter === 'resolved') return t.status !== 'active' && t.status !== 'escalated'
    return true
  })

  function loadThread(threadId: string) {
    setLoadingMessages(true)
    api('/api/portals/' + subdomain + '/support/threads/' + threadId).then(function(res) {
      var d = res.data as { messages?: SupportMessage[] } | undefined
      setMessages(d?.messages || [])
      setLoadingMessages(false)
    }).catch(function() { setLoadingMessages(false) })
  }

  function toggleThread(threadId: string) {
    if (expandedId === threadId) { setExpandedId(null); setMessages([]) }
    else { setExpandedId(threadId); loadThread(threadId) }
    setReplyText(''); setQueuedAttachments([])
  }

  function sendReply() {
    if (!replyText.trim() || !expandedId || sending) return
    setSending(true)
    api('/api/portals/' + subdomain + '/support/threads/' + expandedId + '/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText.trim(), attachments: queuedAttachments.length > 0 ? JSON.stringify(queuedAttachments) : undefined }),
    }).then(function() {
      setReplyText(''); setQueuedAttachments([]); setSending(false)
      loadThread(expandedId!)
    }).catch(function() { setSending(false) })
  }

  function uploadFile(file: File) {
    if (!expandedId || uploading) return
    setUploading(true)
    var fd = new FormData(); fd.append('file', file)
    fetch('/api/portals/' + subdomain + '/support/threads/' + expandedId + '/attachments', {
      method: 'POST', credentials: 'include', body: fd,
    }).then(function(r) { return r.json() }).then(function(res: Record<string, unknown>) {
      if (res.ok && res.data) {
        var att = (res.data as Record<string, unknown>).attachment as Attachment
        setQueuedAttachments(function(prev) { return prev.concat(att) })
      }
      setUploading(false)
    }).catch(function() { setUploading(false) })
  }

  function getSignedUrl(_updateId: string, attId: string) {
    if (!expandedId) return Promise.resolve({} as { url?: string; data?: { url?: string } })
    return api('/api/portals/' + subdomain + '/support/threads/' + expandedId + '/attachments/' + attId + '/url') as Promise<{ url?: string; data?: { url?: string } }>
  }

  return (
    <div>
      <FilterRow count={filtered.length} countLabel="thread">
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'all', label: 'All threads' },
          { value: 'active', label: 'Open' },
          { value: 'resolved', label: 'Resolved' },
        ]} />
      </FilterRow>
      {filtered.length === 0 ? <EmptyState message="No support threads" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {filtered.map(function(t) {
            var isExpanded = expandedId === t.id
            return (
              <div key={t.id}>
                <div onClick={function() { toggleThread(t.id) }} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 0', borderBottom: isExpanded ? 'none' : '1px solid var(--border, #e5e7eb)',
                  cursor: 'pointer',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--foreground, var(--text-0, inherit))' }}>
                        {t.subject || 'Support thread'}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted, var(--text-3, #9ca3af))' }}>
                      {(t.message_count ? t.message_count + ' messages · ' : '') +
                       (t.updated_at ? relativeTime(t.updated_at) : '') +
                       (t.last_role ? ' · ' + (t.last_role === 'user' ? 'Awaiting reply' : 'Replied') : '')}
                    </div>
                  </div>
                  <StatusPill status={t.status === 'active' || t.status === 'escalated' ? 'active' : 'resolved'} />
                </div>
                {isExpanded && (
                  <div style={{
                    background: 'var(--bg-subtle, var(--bg-2, #f9fafb))', border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: 'var(--radius, 8px)', margin: '4px 0 12px', padding: 14,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    {loadingMessages ? (
                      <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: 'var(--muted, #9ca3af)' }}>Loading...</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {messages.map(function(msg) {
                          var isUser = msg.role === 'user'
                          var isHuman = msg.role === 'human'
                          return (
                            <div key={msg.id}>
                              {!isUser && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, fontSize: 11, color: isHuman ? 'var(--accent, #7c5cbf)' : 'var(--muted, #9ca3af)' }}>
                                  {msg.role === 'assistant' ? <span>AI · Support</span> : <span>Team</span>}
                                </div>
                              )}
                              <div style={{
                                alignSelf: isUser ? 'flex-end' : 'flex-start',
                                maxWidth: '85%', padding: '8px 12px', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                                borderRadius: 10,
                                borderBottomRightRadius: isUser ? 3 : 10,
                                borderBottomLeftRadius: !isUser ? 3 : 10,
                                background: isUser ? 'var(--accent, #7c5cbf)' : isHuman ? 'var(--accent-soft, #EEEDFE)' : 'var(--bg-0, transparent)',
                                color: isUser ? '#fff' : isHuman ? 'var(--accent, #7c5cbf)' : 'var(--foreground, inherit)',
                                border: isHuman ? '1px solid hsla(262,60%,55%,.2)' : isUser ? 'none' : '1px solid var(--border, #e5e7eb)',
                                marginLeft: isUser ? 'auto' : 0,
                                marginRight: isUser ? 0 : 'auto',
                              }}>{msg.content}</div>
                              {msg.attachments && (
                                <div style={{ marginLeft: isUser ? 'auto' : 0, maxWidth: '85%' }}>
                                  <UpdateAttachments attachments={msg.attachments} updateId={t.id} getSignedUrl={getSignedUrl} compact />
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {(t.status === 'active' || t.status === 'escalated') && (
                      <div style={{ borderTop: '1px solid var(--border, #e5e7eb)', paddingTop: 8 }}
                        onDragOver={function(e) { e.preventDefault() }}
                        onDrop={function(e) { e.preventDefault(); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) uploadFile(f) }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <button onClick={function() { fileInputRef.current && fileInputRef.current.click() }} disabled={uploading} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: uploading ? 'default' : 'pointer',
                            border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-0, transparent)',
                            color: 'var(--muted, #6b7280)', fontFamily: 'inherit', opacity: uploading ? 0.5 : 1,
                          }}>{uploading ? 'Uploading...' : 'Attach file'}</button>
                          <span style={{ fontSize: 11, color: 'var(--muted, #9ca3af)' }}>or drag and drop</span>
                          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={function(e) { var f = e.target.files && e.target.files[0]; if (f) uploadFile(f); if (fileInputRef.current) fileInputRef.current.value = '' }}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.mp4,.mov" />
                        </div>
                        {queuedAttachments.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                            {queuedAttachments.map(function(att) {
                              return <span key={att.id} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 8px', borderRadius: 6, fontSize: 11,
                                border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-subtle, #f9fafb)',
                                color: 'var(--foreground, #374151)',
                              }}>
                                {att.filename || att.id}
                                <span onClick={function() { setQueuedAttachments(function(prev) { return prev.filter(function(a) { return a.id !== att.id }) }) }} style={{ cursor: 'pointer', color: 'var(--muted, #9ca3af)', fontSize: 13, lineHeight: 1 }}>x</span>
                              </span>
                            })}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input type="text" value={replyText} onChange={function(e) { setReplyText(e.target.value) }}
                            onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) sendReply() }}
                            placeholder="Reply to this thread..." disabled={sending}
                            style={{
                              flex: 1, fontSize: 13, padding: '8px 10px',
                              border: '1px solid var(--border, #e5e7eb)', borderRadius: 6,
                              background: 'var(--bg-0, transparent)', color: 'var(--foreground, #111)', fontFamily: 'inherit',
                            }}
                          />
                          <button onClick={sendReply} disabled={sending || !replyText.trim()} style={{
                            padding: '6px 14px', borderRadius: 6, border: 'none',
                            background: 'var(--accent, #7c5cbf)', color: '#fff',
                            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                            opacity: sending || !replyText.trim() ? 0.5 : 1,
                          }}>Send</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Admin support section (team — preserved from original) ─────────────────

function SupportSectionAdmin({ api, onNavigate }: { api: PortalUpdatesV2Props['api']; onNavigate?: (path: string) => void }) {
  var [threads, setThreads] = useState<SupportThread[]>([])
  var [loading, setLoading] = useState(true)
  var [statusFilter, setStatusFilter] = useState('all')
  var [productFilter, setProductFilter] = useState('all')
  var [expandedId, setExpandedId] = useState<string | null>(null)
  var [detail, setDetail] = useState<AdminThreadDetail | null>(null)
  var [detailLoading, setDetailLoading] = useState(false)
  var [replyText, setReplyText] = useState('')
  var [sending, setSending] = useState(false)
  var [adminQueuedAttachments, setAdminQueuedAttachments] = useState<Attachment[]>([])
  var [adminUploading, setAdminUploading] = useState(false)
  var adminFileInputRef = useRef<HTMLInputElement>(null)

  var loadList = useCallback(function() {
    setLoading(true)
    var qs = ''
    if (statusFilter !== 'all') qs += '&status=' + statusFilter
    if (productFilter !== 'all') qs += '&product=' + productFilter
    api('/api/support/threads?' + qs.replace(/^&/, '')).then(function(res) {
      if (res.ok) setThreads((res.data as { threads?: SupportThread[] })?.threads || [])
    }).catch(function() {}).finally(function() { setLoading(false) })
  }, [api, statusFilter, productFilter])

  useEffect(function() { loadList() }, [loadList])

  useEffect(function() {
    if (!expandedId) { setDetail(null); return }
    setDetailLoading(true)
    api('/api/support/threads/' + expandedId).then(function(res) {
      if (res.ok) setDetail(res.data as AdminThreadDetail)
      setDetailLoading(false)
    }).catch(function() { setDetailLoading(false) })
  }, [expandedId, api])

  function toggleThread(threadId: string) {
    if (expandedId === threadId) { setExpandedId(null); setDetail(null) }
    else { setExpandedId(threadId) }
    setReplyText(''); setAdminQueuedAttachments([])
  }

  function sendReply() {
    if (!replyText.trim() || !expandedId || sending) return
    setSending(true)
    api('/api/support/threads/' + expandedId + '/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText.trim(), attachments: adminQueuedAttachments.length > 0 ? JSON.stringify(adminQueuedAttachments) : undefined }),
    }).then(function() {
      setReplyText(''); setAdminQueuedAttachments([]); setSending(false)
      api('/api/support/threads/' + expandedId).then(function(res) { if (res.ok) setDetail(res.data as AdminThreadDetail) })
    }).catch(function() { setSending(false) })
  }

  function adminUploadFile(file: File) {
    if (!expandedId || adminUploading) return
    setAdminUploading(true)
    var fd = new FormData(); fd.append('file', file)
    fetch('/api/support/threads/' + expandedId + '/attachments', {
      method: 'POST', credentials: 'include', body: fd,
    }).then(function(r) { return r.json() }).then(function(res: Record<string, unknown>) {
      if (res.ok && res.data) {
        var att = (res.data as Record<string, unknown>).attachment as Attachment
        setAdminQueuedAttachments(function(prev) { return prev.concat(att) })
      }
      setAdminUploading(false)
    }).catch(function() { setAdminUploading(false) })
  }

  function getSignedUrl(_updateId: string, attId: string) {
    if (!expandedId) return Promise.resolve({} as { url?: string; data?: { url?: string } })
    return api('/api/support/threads/' + expandedId + '/attachments/' + attId + '/url') as Promise<{ url?: string; data?: { url?: string } }>
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, fontSize: 12, color: 'var(--muted, #9ca3af)' }}>Loading support threads...</div>

  return (
    <div>
      <FilterRow count={threads.length} countLabel="thread">
        <SelectFilter value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'all', label: 'All statuses' },
          { value: 'active', label: 'Open' },
          { value: 'resolved', label: 'Resolved' },
        ]} />
        <SelectFilter value={productFilter} onChange={setProductFilter} options={[
          { value: 'all', label: 'All portals' },
          { value: 'studios', label: 'Studios' },
          { value: 'signal', label: 'Signal' },
          { value: 'mode', label: 'Mode' },
          { value: 'investors', label: 'Investors' },
        ]} />
      </FilterRow>
      {threads.length === 0 ? <EmptyState message="No support threads" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {threads.map(function(t) {
            var isExpanded = expandedId === t.id
            var threadDetail = isExpanded ? detail : null
            return (
              <div key={t.id}>
                <div onClick={function() { toggleThread(t.id) }} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 0', borderBottom: isExpanded ? 'none' : '1px solid var(--border, #e5e7eb)',
                  cursor: 'pointer',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--foreground, inherit)' }}>{t.subject || 'Support thread'}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted, #9ca3af)' }}>
                      {t.contact_name || t.contact_email || ''}{t.product ? ' · ' + t.product : ''}{' · '}{relativeTime(t.updated_at || t.created_at)}
                    </div>
                  </div>
                  <StatusPill status={t.status === 'active' || t.status === 'escalated' ? 'active' : 'resolved'} />
                </div>
                {isExpanded && (
                  <div style={{
                    border: '1px solid var(--border, #e5e7eb)', borderRadius: 'var(--radius, 8px)',
                    margin: '4px 0 12px', overflow: 'hidden', background: 'var(--bg-card, #fff)',
                  }}>
                    {detailLoading && !threadDetail ? (
                      <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: 'var(--muted, #9ca3af)' }}>Loading...</div>
                    ) : threadDetail ? (
                      <>
                        {/* Context bar */}
                        {threadDetail.context && (
                          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                            {threadDetail.context.company && (
                              <span onClick={function() { if (onNavigate) onNavigate('/crm/' + (threadDetail!.context!.company as Record<string, unknown>).id) }}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--bg-subtle, #f3f4f6)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 99, fontSize: 11, color: 'var(--accent, #7c5cbf)', cursor: 'pointer' }}>
                                {String((threadDetail.context.company as Record<string, unknown>).name || 'Company')}
                              </span>
                            )}
                          </div>
                        )}
                        {/* Messages */}
                        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(threadDetail.messages || []).map(function(msg) {
                            var isUser = msg.role === 'user'
                            var isBot = msg.role === 'assistant'
                            var isHuman = msg.role === 'human'
                            if (!isUser && !isBot && !isHuman) {
                              return <div key={msg.id} style={{ display: 'flex', justifyContent: 'center' }}>
                                <span style={{ padding: '3px 12px', background: 'var(--bg-subtle, #f3f4f6)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 99, fontSize: 11, color: 'var(--muted, #6b7280)' }}>{msg.content}</span>
                              </div>
                            }
                            return (
                              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                                {!isUser && <div style={{ fontSize: 11, color: isHuman ? 'var(--accent, #7c5cbf)' : 'var(--muted, #9ca3af)', marginBottom: 4 }}>
                                  {isBot ? 'AI · Support' : 'Team'}
                                </div>}
                                <div style={{
                                  maxWidth: '82%', padding: '8px 12px', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                                  borderRadius: 10,
                                  borderBottomRightRadius: isUser ? 3 : 10,
                                  borderBottomLeftRadius: !isUser ? 3 : 10,
                                  background: isUser ? 'var(--accent, #7c5cbf)' : isHuman ? 'var(--accent-soft, #EEEDFE)' : 'var(--bg-0, transparent)',
                                  color: isUser ? '#fff' : isHuman ? 'var(--accent, #7c5cbf)' : 'var(--foreground, inherit)',
                                  border: isHuman ? '1px solid hsla(262,60%,55%,.2)' : isUser ? 'none' : '1px solid var(--border, #e5e7eb)',
                                }}>{msg.content}</div>
                                {msg.attachments && (
                                  <div style={{ maxWidth: '82%' }}>
                                    <UpdateAttachments attachments={msg.attachments} updateId={t.id} getSignedUrl={getSignedUrl} compact />
                                  </div>
                                )}
                                <div style={{ fontSize: 10, color: 'var(--muted, #9ca3af)', marginTop: 3, padding: '0 2px' }}>{relativeTime(msg.created_at)}</div>
                              </div>
                            )
                          })}
                        </div>
                        {/* Reply bar */}
                        {t.status !== 'closed' && (
                          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border, #e5e7eb)', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-subtle, #f9fafb)' }}
                            onDragOver={function(e) { e.preventDefault() }}
                            onDrop={function(e) { e.preventDefault(); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) adminUploadFile(f) }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button onClick={function() { adminFileInputRef.current && adminFileInputRef.current.click() }} disabled={adminUploading} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: adminUploading ? 'default' : 'pointer',
                                border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-0, transparent)',
                                color: 'var(--muted, #6b7280)', fontFamily: 'inherit', opacity: adminUploading ? 0.5 : 1,
                              }}>{adminUploading ? 'Uploading...' : 'Attach file'}</button>
                              <input ref={adminFileInputRef} type="file" style={{ display: 'none' }} onChange={function(e) { var f = e.target.files && e.target.files[0]; if (f) adminUploadFile(f); if (adminFileInputRef.current) adminFileInputRef.current.value = '' }}
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.mp4,.mov" />
                            </div>
                            {adminQueuedAttachments.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {adminQueuedAttachments.map(function(att) {
                                  return <span key={att.id} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '3px 8px', borderRadius: 6, fontSize: 11,
                                    border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-subtle, #f9fafb)',
                                    color: 'var(--foreground, #374151)',
                                  }}>
                                    {att.filename || att.id}
                                    <span onClick={function() { setAdminQueuedAttachments(function(prev) { return prev.filter(function(a) { return a.id !== att.id }) }) }}
                                      style={{ cursor: 'pointer', color: 'var(--muted, #9ca3af)', fontSize: 13, lineHeight: 1 }}>x</span>
                                  </span>
                                })}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input type="text" value={replyText} onChange={function(e) { setReplyText(e.target.value) }}
                                onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) sendReply() }}
                                placeholder="Reply to this thread..." disabled={sending}
                                style={{ flex: 1, fontSize: 13, padding: '8px 10px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 6, background: 'var(--bg-0, transparent)', color: 'var(--foreground, #111)', fontFamily: 'inherit' }}
                              />
                              <button onClick={sendReply} disabled={!replyText.trim() || sending} style={{
                                padding: '6px 14px', borderRadius: 6, border: 'none',
                                background: 'var(--accent, #7c5cbf)', color: '#fff', fontSize: 12, fontWeight: 500,
                                cursor: 'pointer', fontFamily: 'inherit', opacity: !replyText.trim() || sending ? 0.5 : 1,
                              }}>Send</button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Mute settings panel ────────────────────────────────────────────────────

interface MuteCategory {
  key: string
  label: string
  description: string
  muted: boolean
}

function MuteSettingsPanel({ api, onClose }: { api: PortalUpdatesV2Props['api']; onClose: () => void }) {
  var [categories, setCategories] = useState<MuteCategory[]>([])
  var [loading, setLoading] = useState(true)
  var [saving, setSaving] = useState(false)

  useEffect(function() {
    api('/api/notifications/mute-settings').then(function(res) {
      if (res.ok) {
        var data = res.data as { categories?: MuteCategory[] }
        setCategories(data?.categories || [])
      }
      setLoading(false)
    }).catch(function() { setLoading(false) })
  }, [api])

  function toggleCategory(key: string) {
    setCategories(function(prev) {
      return prev.map(function(c) {
        return c.key === key ? Object.assign({}, c, { muted: !c.muted }) : c
      })
    })
  }

  function save() {
    setSaving(true)
    var muted = categories.filter(function(c) { return c.muted }).map(function(c) { return c.key })
    api('/api/notifications/mute-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ muted_categories: muted }),
    }).then(function() {
      setSaving(false)
      onClose()
    }).catch(function() { setSaving(false) })
  }

  return (
    <div style={{
      position: 'absolute', top: '100%', right: 0, marginTop: 4,
      width: 320, maxHeight: 420, overflow: 'auto',
      background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e5e7eb)',
      borderRadius: 'var(--radius, 8px)', boxShadow: '0 8px 24px rgba(0,0,0,.12)',
      zIndex: 50, padding: '12px 0',
    }}>
      <div style={{ padding: '0 16px 10px', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground, inherit)' }}>Notification Settings</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--muted, #9ca3af)', lineHeight: 1, padding: '0 2px', fontFamily: 'inherit' }}>&times;</button>
      </div>
      <div style={{ padding: '4px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24, fontSize: 12, color: 'var(--muted, #9ca3af)' }}>Loading...</div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, fontSize: 12, color: 'var(--muted, #9ca3af)' }}>No categories available</div>
        ) : (
          categories.map(function(cat) {
            return (
              <div key={cat.key} onClick={function() { toggleCategory(cat.key) }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px',
                cursor: 'pointer', transition: 'background .1s',
              }}
                onMouseEnter={function(e) { (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-subtle, rgba(0,0,0,.03))' }}
                onMouseLeave={function(e) { (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                {/* Toggle switch */}
                <div style={{
                  width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                  background: cat.muted ? 'var(--border, #d1d5db)' : 'var(--accent, var(--blue, #2362ea))',
                  position: 'relative', transition: 'background .15s',
                }}>
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: cat.muted ? 2 : 18,
                    transition: 'left .15s',
                    boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 500,
                    color: cat.muted ? 'var(--muted, #9ca3af)' : 'var(--foreground, inherit)',
                  }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted, #9ca3af)', lineHeight: 1.3 }}>{cat.description}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
      {!loading && categories.length > 0 && (
        <div style={{ padding: '10px 16px 4px', borderTop: '1px solid var(--border, #e5e7eb)' }}>
          <button onClick={save} disabled={saving} style={{
            width: '100%', padding: '8px 0', borderRadius: 6, border: 'none',
            background: 'var(--accent, var(--blue, #2362ea))', color: '#fff',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            opacity: saving ? 0.5 : 1,
          }}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────────

export function PortalUpdatesV2({ api, subdomain, title, subtitle: _subtitle, shortcutKey, userContactId: _userContactId, onNavigate }: PortalUpdatesV2Props) {
  var [loading, setLoading] = useState(true)
  var [error, setError] = useState<string | null>(null)
  var [audiences, setAudiences] = useState<string[]>([])
  var [activeSection, setActiveSection] = useState<SectionId>('feed')
  var [showMuteSettings, setShowMuteSettings] = useState(false)

  // Data stores
  var [feedItems, setFeedItems] = useState<UpdateItem[]>([])
  var [taskItems, setTaskItems] = useState<TaskItem[]>([])
  var [supportThreads, setSupportThreads] = useState<SupportThread[]>([])

  var isTeam = audiences.includes('team')
  var effectiveOnNavigate = onNavigate || (isTeam ? function(path: string) { window.open('https://admin.sprintmode.ai' + path, '_blank') } : undefined)

  var load = useCallback(function() {
    setLoading(true)
    setError(null)

    var updatesPromise = api('/api/portal/updates').then(function(res: Record<string, unknown>) {
      var d = res.data as { items?: UpdateItem[]; audiences?: string[] } | undefined
      var items = d?.items || []
      var auds = d?.audiences || ['clients']
      setAudiences(auds)
      // All items go into the unified feed — no client-side splitting
      setFeedItems(items)
    })

    var tasksPromise = api('/api/portal/tasks').then(function(res: Record<string, unknown>) {
      var d = res.data as { items?: TaskItem[] } | undefined
      setTaskItems(d?.items || [])
    }).catch(function() { setTaskItems([]) })

    var supportPromise = subdomain
      ? api('/api/portals/' + subdomain + '/support/threads').then(function(res: Record<string, unknown>) {
          var d = res.data as SupportThread[] | undefined
          setSupportThreads(d || [])
        }).catch(function() { setSupportThreads([]) })
      : Promise.resolve()

    Promise.all([updatesPromise, tasksPromise, supportPromise])
      .then(function() { setLoading(false) })
      .catch(function(e: Error) { setError(e.message || 'Failed to load'); setLoading(false) })
  }, [api, subdomain])

  useEffect(function() { load() }, [load])

  // Section tabs: Feed is always shown. Tasks shown if items exist.
  // Support: team sees admin view, non-team sees portal threads.
  var sections: { id: SectionId; label: string; count: number }[] = [
    { id: 'feed', label: 'Feed', count: feedItems.filter(function(i) { return !i.read_at }).length },
  ]
  if (taskItems.length > 0) {
    sections.push({ id: 'tasks', label: 'Tasks', count: taskItems.filter(function(i) { return i.status !== 'completed' }).length })
  }
  if (isTeam || supportThreads.length > 0) {
    sections.push({ id: 'support', label: 'Support', count: isTeam ? 0 : supportThreads.filter(function(t) { return t.status === 'active' || t.status === 'escalated' }).length })
  }

  var effectiveSection = activeSection
  if (!sections.find(function(s) { return s.id === effectiveSection })) {
    effectiveSection = 'feed'
  }

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div style={{
            width: 24, height: 24,
            border: '2px solid var(--border, #e5e7eb)',
            borderTopColor: 'var(--accent, #7c5cbf)',
            borderRadius: '50%',
            animation: 'pu2-spin 0.7s linear infinite',
          }} />
          <style>{`@keyframes pu2-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 0 }}>
        <div style={{ padding: 24, color: 'var(--red, #ef4444)', fontSize: 14 }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={{ padding: 0 }}>
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--foreground, var(--text-0, inherit))', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          {title || 'Inbox'}
          {shortcutKey && <kbd style={{ fontSize: 10, padding: '1px 5px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg-subtle, var(--bg))', color: 'var(--muted)', lineHeight: 1.4, fontFamily: 'var(--font-mono,monospace)', fontWeight: 400 }}>
            {typeof navigator !== 'undefined' && navigator.platform && navigator.platform.indexOf('Mac') !== -1 ? '\u2318' + shortcutKey.toUpperCase() : 'Ctrl+' + shortcutKey.toUpperCase()}
          </kbd>}
          <button
            onClick={function() { setShowMuteSettings(function(p) { return !p }) }}
            title="Notification settings"
            style={{
              marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
              padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center',
              color: showMuteSettings ? 'var(--accent, var(--blue, #2362ea))' : 'var(--muted, #9ca3af)',
              transition: 'color .15s',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </h1>
        {showMuteSettings && <MuteSettingsPanel api={api} onClose={function() { setShowMuteSettings(false); load() }} />}
      </div>

      {/* Section tabs — only show if more than one section */}
      {sections.length > 1 && (
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border, #e5e7eb)', marginBottom: 16 }}>
          {sections.map(function(sec) {
            var isActive = sec.id === effectiveSection
            return (
              <button
                key={sec.id}
                onClick={function() { setActiveSection(sec.id) }}
                style={{
                  fontSize: 13, padding: '8px 16px', cursor: 'pointer',
                  border: 'none', background: 'none', fontFamily: 'inherit',
                  borderBottom: isActive ? '2px solid var(--accent, #7c5cbf)' : '2px solid transparent',
                  color: isActive ? 'var(--foreground, var(--text-0, inherit))' : 'var(--muted, var(--text-3, #9ca3af))',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'color .15s, border-color .15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {sec.label}
                {sec.count > 0 && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 18, height: 18, borderRadius: 99,
                    fontSize: 10, fontWeight: 500, padding: '0 5px',
                    background: isActive ? 'var(--accent-soft, var(--accent-bg, #EEEDFE))' : 'var(--bg-subtle, var(--bg-2, #f3f4f6))',
                    color: isActive ? 'var(--accent, #7c5cbf)' : 'var(--muted, var(--text-3, #9ca3af))',
                  }}>{sec.count}</span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {effectiveSection === 'feed' && <FeedSection items={feedItems} api={api} onNavigate={effectiveOnNavigate} isTeam={isTeam} subdomain={subdomain} />}
      {effectiveSection === 'tasks' && <TasksSection items={taskItems} api={api} onNavigate={effectiveOnNavigate} />}
      {effectiveSection === 'support' && isTeam && <SupportSectionAdmin api={api} onNavigate={effectiveOnNavigate} />}
      {effectiveSection === 'support' && !isTeam && subdomain && <SupportSectionPortal threads={supportThreads} api={api} subdomain={subdomain} />}
    </div>
  )
}

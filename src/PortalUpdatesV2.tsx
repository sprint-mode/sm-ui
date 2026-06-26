import React, { useState, useEffect, useCallback, useRef } from 'react'
import { UpdateAttachments, Attachment } from './UpdateAttachments.tsx'

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

interface BugItem {
  id: string
  title: string
  type?: string
  priority?: string
  status?: string
  product?: string
  thread_id?: string
  created_at?: string
  body?: string
  tags?: string
  assigned_to?: string
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

type TabId = 'general' | 'tasks' | 'project' | 'bugs' | 'reports' | 'support'

interface TabDef {
  id: TabId
  label: string
  count: number
}

export interface PortalUpdatesV2Props {
  api: (path: string, opts?: Record<string, unknown>) => Promise<Record<string, unknown>>
  subdomain?: string
  title?: string
  subtitle?: string
  userContactId?: string
  onNavigate?: (path: string) => void
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

var TYPE_LABELS: Record<string, string> = {
  ai_weekly: 'AI weekly', sprint_report: 'Sprint report', milestone: 'Milestone',
  announcement: 'Announcement', policy: 'Policy', culture: 'Culture',
  flash_update: 'Flash update', board_update: 'Board update', general: 'General',
  system_event: 'Notification', support_reply: 'Support reply',
  follow_up: 'Follow-up', call: 'Call', email: 'Email',
}

var TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  ai_weekly: { bg: '#EEEDFE', color: '#3C3489' },
  sprint_report: { bg: '#EEEDFE', color: '#3C3489' },
  milestone: { bg: '#EAF3DE', color: '#27500A' },
  announcement: { bg: '#E6F1FB', color: '#0C447C' },
  policy: { bg: '#FAEEDA', color: '#633806' },
  culture: { bg: '#E1F5EE', color: '#085041' },
  flash_update: { bg: '#FCEBEB', color: '#791F1F' },
  board_update: { bg: '#E6F1FB', color: '#0C447C' },
  general: { bg: 'var(--bg-2, #f3f4f6)', color: 'var(--text-2, #6b7280)' },
  system_event: { bg: '#FAEEDA', color: '#633806' },
  support_reply: { bg: '#FAEEDA', color: '#633806' },
  bug: { bg: '#FCEBEB', color: '#791F1F' },
  task: { bg: '#E6F1FB', color: '#0C447C' },
  action_item: { bg: '#E1F5EE', color: '#085041' },
  open_item: { bg: '#EEEDFE', color: '#3C3489' },
  feature: { bg: '#EAF3DE', color: '#27500A' },
  tech_debt: { bg: '#FAEEDA', color: '#633806' },
  gap: { bg: 'var(--bg-2, #f3f4f6)', color: 'var(--text-2, #6b7280)' },
  fix: { bg: '#E1F5EE', color: '#085041' },
}

var PRIORITY_COLORS: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#FCEBEB', color: '#791F1F' },
  high: { bg: '#FCEBEB', color: '#791F1F' },
  normal: { bg: 'var(--bg-2, #f3f4f6)', color: 'var(--text-2, #6b7280)' },
  low: { bg: 'var(--bg-2, #f3f4f6)', color: 'var(--text-3, #9ca3af)' },
}

var STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  open: { bg: '#E6F1FB', color: '#0C447C' },
  completed: { bg: '#EAF3DE', color: '#27500A' },
  active: { bg: '#EAF3DE', color: '#27500A' },
  resolved: { bg: 'var(--bg-2, #f3f4f6)', color: 'var(--text-2, #6b7280)' },
  closed: { bg: 'var(--bg-2, #f3f4f6)', color: 'var(--text-2, #6b7280)' },
  escalated: { bg: '#FCEBEB', color: '#791F1F' },
}

var PRODUCT_COLORS: Record<string, { bg: string; color: string }> = {
  studios: { bg: 'var(--violet-soft, #EEEDFE)', color: 'var(--violet, #534AB7)' },
  signal: { bg: 'hsla(340,55%,47%,.1)', color: 'hsl(340,55%,47%)' },
  mode: { bg: 'hsla(160,84%,39%,.1)', color: 'hsl(160,84%,39%)' },
  privacyai: { bg: 'hsla(190,84%,39%,.1)', color: 'hsl(190,84%,39%)' },
  investor: { bg: 'var(--accent-soft, #E6F1FB)', color: 'var(--accent, #534AB7)' },
}

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

function initials(name: string | undefined): string {
  return (name || 'A').split(' ').map(function(w) { return w[0] }).join('').slice(0, 2).toUpperCase()
}

// ─── Seen tracking helpers ─────────────────────────────────────────────────────

var SEEN_KEY_PREFIX = 'sm_inbox_seen_'

function getTabSeenAt(tabId: string): number {
  try {
    var val = localStorage.getItem(SEEN_KEY_PREFIX + tabId)
    return val ? parseInt(val, 10) : 0
  } catch { return 0 }
}

function setTabSeenAt(tabId: string): void {
  try { localStorage.setItem(SEEN_KEY_PREFIX + tabId, String(Date.now())) } catch {}
}

function isItemNew(dateStr: string | undefined, seenAt: number): boolean {
  if (!dateStr || !seenAt) return !seenAt && !!dateStr
  return new Date(dateStr).getTime() > seenAt
}

function NewDot() {
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c5cbf', flexShrink: 0 }} />
}

function SeenDotPlaceholder() {
  return <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'transparent', flexShrink: 0 }} />
}

function NewPill({ label }: { label?: string }) {
  return <span style={{
    fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 10,
    background: '#EEEDFE', color: '#534AB7', whiteSpace: 'nowrap', flexShrink: 0,
  }}>{label || 'New'}</span>
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

function TypePill({ type }: { type: string | undefined }) {
  var t = type || 'general'
  var c = TYPE_COLORS[t] || TYPE_COLORS.general
  var label = TYPE_LABELS[t] || t.replace(/_/g, ' ')
  return <Pill label={label} bg={c.bg} color={c.color} />
}

function PriorityPill({ priority }: { priority: string | undefined }) {
  var p = priority || 'normal'
  var c = PRIORITY_COLORS[p] || PRIORITY_COLORS.normal
  return <Pill label={p} bg={c.bg} color={c.color} />
}

function StatusPill({ status }: { status: string | undefined }) {
  var s = status || 'open'
  var c = STATUS_COLORS[s] || STATUS_COLORS.open
  return <Pill label={s} bg={c.bg} color={c.color} />
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      textAlign: 'center', padding: '48px 24px',
      border: '1px solid var(--border, #e5e7eb)', borderRadius: 'var(--radius, 8px)',
      color: 'var(--text-3, #9ca3af)',
    }}>
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  )
}

function FilterRow({ children, count, countLabel }: { children: React.ReactNode; count: number; countLabel: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      {children}
      <span style={{ fontSize: 12, color: 'var(--text-3, #9ca3af)', marginLeft: 'auto' }}>
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

// ─── Tab content renderers ──────────────────────────────────────────────────────

function GeneralTab({ items, api, lastSeenAt }: { items: UpdateItem[]; api: PortalUpdatesV2Props['api']; lastSeenAt?: number }) {
  var [filter, setFilter] = useState('all')
  var [expandedId, setExpandedId] = useState<string | null>(null)
  var seenAt = lastSeenAt || 0
  var filtered = items.filter(function(i) {
    if (filter === 'unread') return !i.read_at
    if (filter === 'read') return !!i.read_at
    return true
  })

  function getSignedUrl(updateId: string, attId: string) {
    return api('/api/updates/' + updateId + '/attachments/' + attId + '/url') as Promise<{ url?: string; data?: { url?: string } }>
  }

  return (
    <div>
      <FilterRow count={filtered.length} countLabel="update">
        <SelectFilter value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
          { value: 'read', label: 'Read' },
        ]} />
      </FilterRow>
      {filtered.length === 0 ? <EmptyState message="No updates yet" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(function(item) {
            var isRead = !!item.read_at
            var itemIsNew = isItemNew(item.published_at, seenAt)
            var isExpanded = expandedId === item.id
            return (
              <div key={item.id} style={{
                background: 'var(--bg-card, inherit)', border: '1px solid var(--border, #e5e7eb)',
                borderRadius: 'var(--radius, 8px)', overflow: 'hidden', cursor: 'pointer',
                transition: 'border-color .12s',
              }} onClick={function() { setExpandedId(isExpanded ? null : item.id) }}>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    {itemIsNew ? <NewDot /> : (!isRead ? <span style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#378ADD',
                      flexShrink: 0, marginTop: 6,
                    }} /> : <SeenDotPlaceholder />)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{
                          fontSize: 14, fontWeight: itemIsNew ? 500 : (isRead ? 400 : 600),
                          color: itemIsNew ? 'var(--text-0, inherit)' : 'var(--text-0, inherit)',
                        }}>{item.title}</span>
                        {itemIsNew && <NewPill />}
                        <TypePill type={item.update_type || item.comm_type} />
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3, #9ca3af)' }}>
                        {relativeTime(item.published_at)}
                        {item.author_name ? ' · ' + item.author_name : ''}
                      </div>
                      {item.body && (
                        <div style={{
                          fontSize: 13, lineHeight: 1.6,
                          color: isExpanded ? 'var(--text-1, #374151)' : 'var(--text-3, #9ca3af)',
                          whiteSpace: isExpanded ? 'pre-wrap' : undefined,
                          marginTop: 8,
                          maxHeight: isExpanded ? undefined : 52,
                          overflow: isExpanded ? undefined : 'hidden',
                        }}>{item.body}</div>
                      )}
                      {isExpanded && (
                        <UpdateAttachments
                          attachments={item.attachments}
                          updateId={item.id}
                          getSignedUrl={getSignedUrl}
                        />
                      )}
                      {!isExpanded && item.body && (
                        <div style={{ fontSize: 11, color: 'var(--accent, #7c5cbf)', marginTop: 6 }}>
                          Show full update{item.attachments && JSON.parse(typeof item.attachments === 'string' ? item.attachments : '[]').length > 0 ? ' + attachments' : ''}
                        </div>
                      )}
                      {isExpanded && (
                        <div style={{ fontSize: 11, color: 'var(--text-3, #9ca3af)', marginTop: 6 }}>
                          Collapse
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TasksTab({ items, api, onNavigate, lastSeenAt }: { items: TaskItem[]; api: PortalUpdatesV2Props['api']; onNavigate?: (path: string) => void; lastSeenAt?: number }) {
  var [statusFilter, setStatusFilter] = useState('all')
  var [completing, setCompleting] = useState<string | null>(null)
  var [localItems, setLocalItems] = useState(items)
  var seenAt = lastSeenAt || 0

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
            var itemIsNew = isItemNew(item.created_at || item.due_date, seenAt)
            return (
              <div key={item.id} onClick={function() { handleRowClick(item) }} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid var(--border, #e5e7eb)',
                cursor: onNavigate ? 'pointer' : 'default',
                transition: 'background .1s',
              }}>
                {itemIsNew ? <NewDot /> : <SeenDotPlaceholder />}
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
                      fontSize: 13, fontWeight: itemIsNew ? 500 : 500,
                      color: isDone ? 'var(--text-3, #9ca3af)' : (itemIsNew ? 'var(--text-0, inherit)' : 'var(--text-0, inherit)'),
                      textDecoration: isDone ? 'line-through' : 'none',
                    }}>{item.title}</span>
                    {itemIsNew && !isDone && <NewPill />}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3, #9ca3af)' }}>
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

function BugsTab({ items, commentNotifications, onNavigate, lastSeenAt }: { items: BugItem[]; commentNotifications?: UpdateItem[]; onNavigate?: (path: string) => void; lastSeenAt?: number }) {
  var [typeFilter, setTypeFilter] = useState('all')
  var [prioFilter, setPrioFilter] = useState('all')
  var [expandedId, setExpandedId] = useState<string | null>(null)
  var seenAt = lastSeenAt || 0

  var typeSet = new Set<string>()
  items.forEach(function(i) { if (i.type) typeSet.add(i.type) })
  var typeOptions = [{ value: 'all', label: 'All types' }]
  Array.from(typeSet).sort().forEach(function(t) {
    typeOptions.push({ value: t, label: t.replace(/_/g, ' ') })
  })

  var filtered = items.filter(function(i) {
    if (typeFilter !== 'all' && i.type !== typeFilter) return false
    if (prioFilter !== 'all' && i.priority !== prioFilter) return false
    return true
  })

  return (
    <div>
      {/* Bug comment notifications */}
      {commentNotifications && commentNotifications.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-3, #9ca3af)', marginBottom: 8 }}>
            New comments
          </div>
          {commentNotifications.map(function(notif) {
            return (
              <div key={notif.id} onClick={function() {
                if (notif.action_url && onNavigate) onNavigate(notif.action_url)
              }} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
                background: 'var(--accent-bg, hsla(262,60%,55%,.06))', border: '1px solid var(--accent-border, hsla(262,60%,55%,.15))',
                borderRadius: 'var(--radius, 8px)', marginBottom: 6,
                cursor: notif.action_url ? 'pointer' : 'default',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-0, inherit)', marginBottom: 2 }}>{notif.title}</div>
                  {notif.body && <div style={{ fontSize: 12, color: 'var(--text-2, #6b7280)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notif.body}</div>}
                  <div style={{ fontSize: 11, color: 'var(--text-3, #9ca3af)', marginTop: 4 }}>
                    {notif.author_name ? notif.author_name + ' · ' : ''}{relativeTime(notif.published_at)}
                  </div>
                </div>
                {notif.action_url && <span style={{ fontSize: 11, color: 'var(--accent, #7c5cbf)', flexShrink: 0, marginTop: 2 }}>View</span>}
              </div>
            )
          })}
        </div>
      )}
      <FilterRow count={filtered.length} countLabel="item">
        <SelectFilter value={typeFilter} onChange={setTypeFilter} options={typeOptions} />
        <SelectFilter value={prioFilter} onChange={setPrioFilter} options={[
          { value: 'all', label: 'All priorities' },
          { value: 'critical', label: 'Critical' },
          { value: 'high', label: 'High' },
          { value: 'normal', label: 'Normal' },
          { value: 'low', label: 'Low' },
        ]} />
      </FilterRow>
      {filtered.length === 0 ? <EmptyState message="No open items" /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {filtered.map(function(item) {
            var isExpanded = expandedId === item.id
            return (
              <div key={item.id}>
                <div onClick={function() { setExpandedId(isExpanded ? null : item.id) }} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 0', borderBottom: isExpanded ? 'none' : '1px solid var(--border, #e5e7eb)',
                  cursor: 'pointer', transition: 'background .1s',
                }}>
                  {(function() { var bugIsNew = isItemNew(item.created_at, seenAt); return bugIsNew ? <NewDot /> : <SeenDotPlaceholder /> })()}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: isItemNew(item.created_at, seenAt) ? 500 : 500, color: isItemNew(item.created_at, seenAt) ? 'var(--text-0, inherit)' : 'var(--text-0, inherit)' }}>{item.title}</span>
                      {isItemNew(item.created_at, seenAt) && <NewPill />}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3, #9ca3af)' }}>
                      {item.product ? item.product + ' · ' : ''}
                      {item.thread_id || ''}
                      {item.created_at ? ' · ' + relativeTime(item.created_at) : ''}
                    </div>
                  </div>
                  <TypePill type={item.type} />
                  <PriorityPill priority={item.priority} />
                </div>
                {isExpanded && (
                  <div style={{
                    padding: '12px 16px', background: 'var(--bg-2, #f9fafb)',
                    borderBottom: '1px solid var(--border, #e5e7eb)',
                    fontSize: 13, lineHeight: 1.6, color: 'var(--text-1, #374151)',
                  }}>
                    {item.body && <div style={{ marginBottom: 8, whiteSpace: 'pre-wrap' }}>{item.body}</div>}
                    {item.tags && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {item.tags.split(',').map(function(tag) {
                          var t = tag.trim()
                          return t ? <span key={t} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', background: 'var(--bg-0, transparent)',
                            border: '1px solid var(--border, #e5e7eb)', borderRadius: 99,
                            fontSize: 11, color: 'var(--text-1, #374151)',
                          }}>{t}</span> : null
                        })}
                      </div>
                    )}
                    {!item.body && !item.tags && <div style={{ color: 'var(--text-3, #9ca3af)' }}>No additional details</div>}
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

// ─── Portal support tab (client/investor) ────────────────────────────────────

function SupportTabPortal({ threads, api, subdomain, lastSeenAt }: { threads: SupportThread[]; api: PortalUpdatesV2Props['api']; subdomain: string; lastSeenAt?: number }) {
  var [statusFilter, setStatusFilter] = useState('all')
  var [expandedId, setExpandedId] = useState<string | null>(null)
  var [messages, setMessages] = useState<SupportMessage[]>([])
  var [loadingMessages, setLoadingMessages] = useState(false)
  var [replyText, setReplyText] = useState('')
  var [sending, setSending] = useState(false)
  var [queuedAttachments, setQueuedAttachments] = useState<Attachment[]>([])
  var [uploading, setUploading] = useState(false)
  var fileInputRef = useRef<HTMLInputElement>(null)
  var seenAt = lastSeenAt || 0

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
    if (expandedId === threadId) {
      setExpandedId(null)
      setMessages([])
    } else {
      setExpandedId(threadId)
      loadThread(threadId)
    }
    setReplyText('')
  }

  function sendReply() {
    if (!replyText.trim() || !expandedId || sending) return
    setSending(true)
    api('/api/portals/' + subdomain + '/support/threads/' + expandedId + '/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText.trim(), attachments: queuedAttachments.length > 0 ? JSON.stringify(queuedAttachments) : undefined }),
    }).then(function() {
      setReplyText('')
      setQueuedAttachments([])
      setSending(false)
      loadThread(expandedId!)
    }).catch(function() { setSending(false) })
  }

  function uploadFile(file: File) {
    if (!expandedId || uploading) return
    setUploading(true)
    var fd = new FormData()
    fd.append('file', file)
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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    var file = e.target.files && e.target.files[0]
    if (file) uploadFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    var file = e.dataTransfer.files && e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }

  function removeAttachment(attId: string) {
    setQueuedAttachments(function(prev) { return prev.filter(function(a) { return a.id !== attId }) })
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
      {filtered.length === 0 ? <EmptyState message="No support threads - everything's good" /> : (
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
                  {(function() {
                    var threadIsNew = isItemNew(t.updated_at || t.created_at, seenAt)
                    var isNewThread = isItemNew(t.created_at, seenAt)
                    return React.createElement(React.Fragment, null,
                      threadIsNew ? React.createElement(NewDot, null) : React.createElement(SeenDotPlaceholder, null),
                      React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 } },
                          React.createElement('span', { style: { fontSize: 13, fontWeight: threadIsNew ? 500 : 500, color: threadIsNew ? 'var(--text-0, inherit)' : 'var(--text-0, inherit)' } }, t.subject || 'Support thread'),
                          threadIsNew ? React.createElement(NewPill, { label: isNewThread ? 'New' : 'New reply' }) : null
                        ),
                        React.createElement('div', { style: { fontSize: 11, color: 'var(--text-3, #9ca3af)' } },
                          (t.message_count ? t.message_count + ' messages \u00b7 ' : '') +
                          (t.updated_at ? relativeTime(t.updated_at) : '') +
                          (t.last_role ? ' \u00b7 ' + (t.last_role === 'user' ? 'Awaiting reply' : 'Replied') : '')
                        )
                      ),
                      React.createElement(StatusPill, { status: t.status === 'active' || t.status === 'escalated' ? 'active' : 'resolved' })
                    )
                  })()}
                </div>
                {isExpanded && (
                  <div style={{
                    background: 'var(--bg-2, #f9fafb)', border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: 'var(--radius, 8px)', margin: '4px 0 12px', padding: 14,
                    display: 'flex', flexDirection: 'column', gap: 10,
                  }}>
                    {loadingMessages ? (
                      <div style={{ textAlign: 'center', padding: 20, fontSize: 12, color: 'var(--text-3, #9ca3af)' }}>Loading...</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {messages.map(function(msg) {
                          var isUser = msg.role === 'user'
                          var isHuman = msg.role === 'human'
                          return (
                            <div key={msg.id}>
                              {!isUser && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, fontSize: 11, color: isHuman ? 'var(--accent, #7c5cbf)' : 'var(--text-3, #9ca3af)' }}>
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
                                color: isUser ? '#fff' : isHuman ? 'var(--accent, #7c5cbf)' : 'var(--text-0, inherit)',
                                border: isHuman ? '1px solid hsla(262,60%,55%,.2)' : isUser ? 'none' : '1px solid var(--border, #e5e7eb)',
                                marginLeft: isUser ? 'auto' : 0,
                                marginRight: isUser ? 0 : 'auto',
                              }}>{msg.content}</div>
                              {msg.attachments && (
                                <div style={{ marginLeft: isUser ? 'auto' : 0, maxWidth: '85%' }}>
                                  <UpdateAttachments
                                    attachments={msg.attachments}
                                    updateId={t.id}
                                    getSignedUrl={getSignedUrl}
                                    compact
                                  />
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
                        onDrop={handleDrop}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <button onClick={function() { fileInputRef.current && fileInputRef.current.click() }} disabled={uploading} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: uploading ? 'default' : 'pointer',
                            border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-0, transparent)',
                            color: 'var(--text-2, #6b7280)', fontFamily: 'inherit', opacity: uploading ? 0.5 : 1,
                          }}>{uploading ? 'Uploading...' : 'Attach file'}</button>
                          <span style={{ fontSize: 11, color: 'var(--text-3, #9ca3af)' }}>or drag and drop</span>
                          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange}
                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.mp4,.mov" />
                        </div>
                        {queuedAttachments.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                            {queuedAttachments.map(function(att) {
                              return <span key={att.id} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 8px', borderRadius: 6, fontSize: 11,
                                border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-2, #f9fafb)',
                                color: 'var(--text-1, #374151)',
                              }}>
                                {att.filename || att.id}
                                <span onClick={function() { removeAttachment(att.id) }} style={{ cursor: 'pointer', color: 'var(--text-3, #9ca3af)', fontSize: 13, lineHeight: 1 }}>x</span>
                              </span>
                            })}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <input
                            type="text"
                            value={replyText}
                            onChange={function(e) { setReplyText(e.target.value) }}
                            onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) sendReply() }}
                            placeholder="Reply to this thread..."
                            disabled={sending}
                            style={{
                              flex: 1, fontSize: 13, padding: '8px 10px',
                              border: '1px solid var(--border, #e5e7eb)', borderRadius: 6,
                              background: 'var(--bg-0, transparent)', color: 'var(--text-1, #111)',
                              fontFamily: 'inherit',
                            }}
                          />
                          <button
                            onClick={sendReply}
                            disabled={sending || !replyText.trim()}
                            style={{
                              padding: '6px 14px', borderRadius: 6, border: 'none',
                              background: 'var(--accent, #7c5cbf)', color: '#fff',
                              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                              opacity: sending || !replyText.trim() ? 0.5 : 1,
                            }}
                          >Send</button>
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

// ─── Admin support tab (flat-list layout) ────────────────────────────────────

function SupportTabAdmin({ api, onNavigate, lastSeenAt, onHasNew }: { api: PortalUpdatesV2Props['api']; onNavigate?: (path: string) => void; lastSeenAt?: number; onHasNew?: (hasNew: boolean) => void }) {
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
  var seenAt = lastSeenAt || 0

  var loadList = useCallback(function() {
    setLoading(true)
    var qs = ''
    if (statusFilter !== 'all') qs += '&status=' + statusFilter
    if (productFilter !== 'all') qs += '&product=' + productFilter
    api('/api/support/threads?' + qs.replace(/^&/, '')).then(function(res) {
      if (res.ok) {
        var loadedThreads = (res.data as { threads?: SupportThread[] })?.threads || []
        setThreads(loadedThreads)
        if (onHasNew) {
          var hasAnyNew = loadedThreads.some(function(t) { return isItemNew(t.updated_at || t.created_at, seenAt) })
          onHasNew(hasAnyNew)
        }
      }
    }).catch(function() {}).finally(function() { setLoading(false) })
  }, [api, statusFilter, productFilter, onHasNew, seenAt])

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
    if (expandedId === threadId) {
      setExpandedId(null)
      setDetail(null)
    } else {
      setExpandedId(threadId)
    }
    setReplyText('')
    setAdminQueuedAttachments([])
  }

  function sendReply() {
    if (!replyText.trim() || !expandedId || sending) return
    setSending(true)
    api('/api/support/threads/' + expandedId + '/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyText.trim(), attachments: adminQueuedAttachments.length > 0 ? JSON.stringify(adminQueuedAttachments) : undefined }),
    }).then(function() {
      setReplyText('')
      setAdminQueuedAttachments([])
      setSending(false)
      api('/api/support/threads/' + expandedId).then(function(res) {
        if (res.ok) setDetail(res.data as AdminThreadDetail)
      })
    }).catch(function() { setSending(false) })
  }

  function adminUploadFile(file: File) {
    if (!expandedId || adminUploading) return
    setAdminUploading(true)
    var fd = new FormData()
    fd.append('file', file)
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

  function adminHandleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    var file = e.target.files && e.target.files[0]
    if (file) adminUploadFile(file)
    if (adminFileInputRef.current) adminFileInputRef.current.value = ''
  }

  function adminHandleDrop(e: React.DragEvent) {
    e.preventDefault()
    var file = e.dataTransfer.files && e.dataTransfer.files[0]
    if (file) adminUploadFile(file)
  }

  function adminRemoveAttachment(attId: string) {
    setAdminQueuedAttachments(function(prev) { return prev.filter(function(a) { return a.id !== attId }) })
  }

  function closeThread(threadId: string) {
    api('/api/support/threads/' + threadId + '/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'resolved' }),
    }).then(function() { setExpandedId(null); setDetail(null); loadList() }).catch(function() {})
  }

  function getSignedUrl(_updateId: string, attId: string) {
    if (!expandedId) return Promise.resolve({} as { url?: string; data?: { url?: string } })
    return api('/api/support/threads/' + expandedId + '/attachments/' + attId + '/url') as Promise<{ url?: string; data?: { url?: string } }>
  }

  var filtered = threads.filter(function(t) {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (productFilter !== 'all' && t.product !== productFilter) return false
    return true
  })

  return (
    <div>
      <FilterRow count={filtered.length} countLabel="thread">
        <SelectFilter value={statusFilter} onChange={function(v) { setStatusFilter(v); setExpandedId(null) }} options={[
          { value: 'all', label: 'All statuses' },
          { value: 'open', label: 'Open' },
          { value: 'escalated', label: 'Escalated' },
          { value: 'closed', label: 'Closed' },
        ]} />
        <SelectFilter value={productFilter} onChange={function(v) { setProductFilter(v); setExpandedId(null) }} options={[
          { value: 'all', label: 'All products' },
          { value: 'studios', label: 'Studios' },
          { value: 'signal', label: 'Signal' },
          { value: 'mode', label: 'Mode' },
          { value: 'privacyai', label: 'PrivacyAI' },
        ]} />
      </FilterRow>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--border, #e5e7eb)', borderTopColor: 'var(--accent, #7c5cbf)', borderRadius: '50%', animation: 'pu2-spin 0.7s linear infinite' }} />
          <style>{`@keyframes pu2-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No support threads" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {filtered.map(function(t) {
            var isExpanded = expandedId === t.id
            var name = t.contact_name || t.contact_email || 'Anonymous'
            var ps = PRODUCT_COLORS[t.product || ''] || { bg: 'var(--bg-2, #f3f4f6)', color: 'var(--text-2, #6b7280)' }
            var threadDetail = isExpanded ? detail : null
            var contact = threadDetail?.context?.contact as Record<string, unknown> | undefined
            var company = threadDetail?.context?.company as Record<string, unknown> | undefined
            var engagement = threadDetail?.context?.engagement as Record<string, unknown> | undefined
            var threadIsNew = isItemNew(t.updated_at || t.created_at, seenAt)
            var isNewThread = isItemNew(t.created_at, seenAt)
            return (
              <div key={t.id}>
                {/* Row */}
                <div onClick={function() { toggleThread(t.id) }} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0', borderBottom: isExpanded ? 'none' : '1px solid var(--border, #e5e7eb)',
                  cursor: 'pointer',
                }}>
                  {threadIsNew ? <NewDot /> : <SeenDotPlaceholder />}
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: t.status === 'escalated' ? '#FCEBEB' : 'var(--accent-soft, #EEEDFE)',
                    color: t.status === 'escalated' ? '#791F1F' : 'var(--accent, #7c5cbf)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700,
                  }}>{initials(name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: threadIsNew ? 500 : 500, color: threadIsNew ? 'var(--text-0, inherit)' : 'var(--text-0, inherit)' }}>
                        {t.subject || name}
                      </span>
                      {threadIsNew && <NewPill label={isNewThread ? 'New' : 'New reply'} />}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-3, #9ca3af)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {name}{t.last_message ? ' · ' + t.last_message : ''}
                    </div>
                  </div>
                  {t.product && <Pill label={t.product.charAt(0).toUpperCase() + t.product.slice(1)} bg={ps.bg} color={ps.color} />}
                  <StatusPill status={t.status} />
                  <span style={{ fontSize: 11, color: 'var(--text-3, #9ca3af)', flexShrink: 0 }}>{relativeTime(t.updated_at)}</span>
                </div>
                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{
                    background: 'var(--bg-2, #f9fafb)', border: '1px solid var(--border, #e5e7eb)',
                    borderRadius: 'var(--radius, 8px)', margin: '4px 0 12px',
                    display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden',
                  }}>
                    {detailLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                        <div style={{ width: 18, height: 18, border: '2px solid var(--border, #e5e7eb)', borderTopColor: 'var(--accent, #7c5cbf)', borderRadius: '50%', animation: 'pu2-spin 0.7s linear infinite' }} />
                      </div>
                    ) : threadDetail ? (
                      <>
                        {/* Contact header */}
                        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-soft, #EEEDFE)', color: 'var(--accent, #7c5cbf)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>
                              {initials(contact?.name as string || contact?.email as string || name)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-0, inherit)' }}>
                                {contact?.name as string || contact?.email as string || name}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-2, #6b7280)' }}>
                                {[company?.name as string, t.product ? t.product.charAt(0).toUpperCase() + t.product.slice(1) : ''].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {onNavigate && <button onClick={function(e) { e.stopPropagation(); onNavigate('/crm') }} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border, #e5e7eb)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--text-2, #6b7280)', fontFamily: 'inherit' }}>CRM</button>}
                            {t.status !== 'closed' && <button onClick={function(e) { e.stopPropagation(); closeThread(t.id) }} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border, #e5e7eb)', background: 'transparent', fontSize: 11, cursor: 'pointer', color: 'var(--text-2, #6b7280)', fontFamily: 'inherit' }}>Close</button>}
                          </div>
                        </div>
                        {/* Context chips */}
                        {(engagement || (contact && Boolean((contact as Record<string, unknown>).last_login_at))) && (
                          <div style={{ padding: '6px 14px', borderBottom: '1px solid var(--border, #e5e7eb)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {engagement && (function() {
                              var engTitle = String(engagement.title || '')
                              var sprintStr = engagement.current_sprint ? ' · Sprint ' + String(engagement.current_sprint) + '/' + String(engagement.total_sprints) : ''
                              return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--bg-2, #f3f4f6)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 99, fontSize: 11, color: 'var(--text-1, #374151)' }}>
                                {engTitle}{sprintStr}
                              </span>
                            })()}
                            {contact && Boolean((contact as Record<string, unknown>).last_login_at) && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--bg-2, #f3f4f6)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 99, fontSize: 11, color: 'var(--text-1, #374151)' }}>
                              Last login {relativeTime((contact as Record<string, unknown>).last_login_at as string)}
                            </span>}
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
                                <span style={{ padding: '3px 12px', background: 'var(--bg-2, #f3f4f6)', border: '1px solid var(--border, #e5e7eb)', borderRadius: 99, fontSize: 11, color: 'var(--text-2, #6b7280)' }}>{msg.content}</span>
                              </div>
                            }
                            return (
                              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                                {!isUser && <div style={{ fontSize: 11, color: isHuman ? 'var(--accent, #7c5cbf)' : 'var(--text-3, #9ca3af)', marginBottom: 4 }}>
                                  {isBot ? 'AI · Support' : 'Team'}
                                </div>}
                                <div style={{
                                  maxWidth: '82%', padding: '8px 12px', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap',
                                  borderRadius: 10,
                                  borderBottomRightRadius: isUser ? 3 : 10,
                                  borderBottomLeftRadius: !isUser ? 3 : 10,
                                  background: isUser ? 'var(--accent, #7c5cbf)' : isHuman ? 'var(--accent-soft, #EEEDFE)' : 'var(--bg-0, transparent)',
                                  color: isUser ? '#fff' : isHuman ? 'var(--accent, #7c5cbf)' : 'var(--text-0, inherit)',
                                  border: isHuman ? '1px solid hsla(262,60%,55%,.2)' : isUser ? 'none' : '1px solid var(--border, #e5e7eb)',
                                }}>{msg.content}</div>
                                {msg.attachments && (
                                  <div style={{ maxWidth: '82%' }}>
                                    <UpdateAttachments attachments={msg.attachments} updateId={t.id} getSignedUrl={getSignedUrl} compact />
                                  </div>
                                )}
                                <div style={{ fontSize: 10, color: 'var(--text-3, #9ca3af)', marginTop: 3, padding: '0 2px' }}>{relativeTime(msg.created_at)}</div>
                              </div>
                            )
                          })}
                        </div>
                        {/* Reply bar */}
                        {t.status !== 'closed' && (
                          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border, #e5e7eb)', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-2, #f9fafb)' }}
                            onDragOver={function(e) { e.preventDefault() }}
                            onDrop={adminHandleDrop}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button onClick={function() { adminFileInputRef.current && adminFileInputRef.current.click() }} disabled={adminUploading} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: adminUploading ? 'default' : 'pointer',
                                border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-0, transparent)',
                                color: 'var(--text-2, #6b7280)', fontFamily: 'inherit', opacity: adminUploading ? 0.5 : 1,
                              }}>{adminUploading ? 'Uploading...' : 'Attach file'}</button>
                              <span style={{ fontSize: 11, color: 'var(--text-3, #9ca3af)' }}>or drag and drop</span>
                              <input ref={adminFileInputRef} type="file" style={{ display: 'none' }} onChange={adminHandleFileChange}
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.mp4,.mov" />
                            </div>
                            {adminQueuedAttachments.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {adminQueuedAttachments.map(function(att) {
                                  return <span key={att.id} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '3px 8px', borderRadius: 6, fontSize: 11,
                                    border: '1px solid var(--border, #e5e7eb)', background: 'var(--bg-2, #f9fafb)',
                                    color: 'var(--text-1, #374151)',
                                  }}>
                                    {att.filename || att.id}
                                    <span onClick={function() { adminRemoveAttachment(att.id) }} style={{ cursor: 'pointer', color: 'var(--text-3, #9ca3af)', fontSize: 13, lineHeight: 1 }}>x</span>
                                  </span>
                                })}
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="text"
                                value={replyText}
                                onChange={function(e) { setReplyText(e.target.value) }}
                                onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) sendReply() }}
                                placeholder="Reply to this thread..."
                                disabled={sending}
                                style={{
                                  flex: 1, fontSize: 13, padding: '8px 10px',
                                  border: '1px solid var(--border, #e5e7eb)', borderRadius: 6,
                                  background: 'var(--bg-0, transparent)', color: 'var(--text-1, #111)',
                                  fontFamily: 'inherit',
                                }}
                              />
                              <button onClick={sendReply} disabled={!replyText.trim() || sending} style={{
                                padding: '6px 14px', borderRadius: 6, border: 'none',
                                background: 'var(--accent, #7c5cbf)', color: '#fff', fontSize: 12, fontWeight: 500,
                                cursor: 'pointer', fontFamily: 'inherit',
                                opacity: !replyText.trim() || sending ? 0.5 : 1,
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

// ─── Main component ─────────────────────────────────────────────────────────────

export function PortalUpdatesV2({ api, subdomain, title, subtitle: _subtitle, userContactId, onNavigate }: PortalUpdatesV2Props) {
  var [loading, setLoading] = useState(true)
  var [error, setError] = useState<string | null>(null)
  var [audiences, setAudiences] = useState<string[]>([])
  var [activeTab, setActiveTab] = useState<TabId | null>(null)
  var [supportAdminHasNew, setSupportAdminHasNew] = useState(false)

  // Seen-at timestamps per tab (from localStorage)
  var [seenTimestamps, setSeenTimestamps] = useState<Record<string, number>>(function() {
    var ts: Record<string, number> = {}
    var tabIds: TabId[] = ['general', 'tasks', 'project', 'bugs', 'reports', 'support']
    tabIds.forEach(function(id) { ts[id] = getTabSeenAt(id) })
    return ts
  })

  // Data stores
  var [generalItems, setGeneralItems] = useState<UpdateItem[]>([])
  var [projectItems, setProjectItems] = useState<UpdateItem[]>([])
  var [bugCommentItems, setBugCommentItems] = useState<UpdateItem[]>([])
  var [taskItems, setTaskItems] = useState<TaskItem[]>([])
  var [bugItems, setBugItems] = useState<BugItem[]>([])
  var [supportThreads, setSupportThreads] = useState<SupportThread[]>([])

  var load = useCallback(function() {
    setLoading(true)
    setError(null)

    var generalPromise = api('/api/portal/updates').then(function(res: Record<string, unknown>) {
      var d = res.data as { items?: UpdateItem[]; audiences?: string[] } | undefined
      var items = d?.items || []
      var auds = d?.audiences || ['clients']
      setAudiences(auds)
      // Separate bug comment notifications from other updates
      var bugComments: UpdateItem[] = []
      var nonBugItems: UpdateItem[] = []
      items.forEach(function(item) {
        if (item.comm_type === 'bug_comment' || item.update_type === 'bug_comment') {
          bugComments.push(item)
        } else {
          nonBugItems.push(item)
        }
      })
      setBugCommentItems(bugComments)
      // Team: all non-bug items go to General
      if (auds.includes('team')) {
        setGeneralItems(nonBugItems)
        return
      }
      // Non-team: split project-type updates into their own tabs
      var general: UpdateItem[] = []
      var project: UpdateItem[] = []
      nonBugItems.forEach(function(item) {
        if (item.update_type === 'ai_weekly' || item.update_type === 'sprint_report') {
          project.push(item)
        } else {
          general.push(item)
        }
      })
      setGeneralItems(general)
      setProjectItems(project)
    })

    var tasksPromise = api('/api/portal/tasks').then(function(res: Record<string, unknown>) {
      var d = res.data as { items?: TaskItem[] } | undefined
      setTaskItems(d?.items || [])
    }).catch(function() { setTaskItems([]) })

    var bugsPromise = api('/api/bugs/threads' + (userContactId ? '?assigned_to=' + userContactId : '')).then(function(res: Record<string, unknown>) {
      var d = res.data as BugItem[] | undefined
      setBugItems(d || [])
    }).catch(function() { setBugItems([]) })

    // Portal support: fetch threads for the portal's subdomain
    var supportPromise = subdomain
      ? api('/api/portals/' + subdomain + '/support/threads').then(function(res: Record<string, unknown>) {
          var d = res.data as SupportThread[] | undefined
          setSupportThreads(d || [])
        }).catch(function() { setSupportThreads([]) })
      : Promise.resolve()

    Promise.all([generalPromise, tasksPromise, bugsPromise, supportPromise])
      .then(function() { setLoading(false) })
      .catch(function(e: Error) {
        setError(e.message || 'Failed to load')
        setLoading(false)
      })
  }, [api, subdomain, userContactId])

  useEffect(function() { load() }, [load])

  // Build tabs — driven by the person's audiences from the API
  var tabs: TabDef[] = []
  if (audiences.length > 0) {
    tabs.push({ id: 'general', label: 'General', count: generalItems.length })
    tabs.push({ id: 'tasks', label: 'Tasks', count: taskItems.length })
    if (audiences.includes('clients')) tabs.push({ id: 'project', label: 'Project', count: projectItems.length })
    if (audiences.includes('investors')) tabs.push({ id: 'reports', label: 'Reports', count: projectItems.length })
    if (audiences.includes('team')) tabs.push({ id: 'bugs', label: 'Bugs', count: bugItems.length + bugCommentItems.length })
    tabs.push({ id: 'support', label: 'Support', count: audiences.includes('team') ? 0 : supportThreads.length })
  }
  var isTeam = audiences.includes('team')
  // Team users on non-admin portals: CRM links open admin in new tab
  var effectiveOnNavigate = onNavigate || (isTeam ? function(path: string) { window.open('https://admin.sprintmode.ai' + path, '_blank') } : undefined)

  var effectiveTab = activeTab
  if (!effectiveTab || !tabs.find(function(t) { return t.id === effectiveTab })) {
    effectiveTab = tabs.length > 0 ? tabs[0].id : null
  }

  // Compute per-tab hasNew for tab dots
  function tabHasNew(tabId: TabId): boolean {
    var ts = seenTimestamps[tabId] || 0
    if (tabId === 'general') return generalItems.some(function(i) { return isItemNew(i.published_at, ts) })
    if (tabId === 'tasks') return taskItems.some(function(i) { return isItemNew(i.created_at || i.due_date, ts) })
    if (tabId === 'project' || tabId === 'reports') return projectItems.some(function(i) { return isItemNew(i.published_at, ts) })
    if (tabId === 'bugs') return bugItems.some(function(i) { return isItemNew(i.created_at, ts) }) || bugCommentItems.some(function(i) { return isItemNew(i.published_at, ts) })
    if (tabId === 'support' && isTeam) return supportAdminHasNew
    if (tabId === 'support') return supportThreads.some(function(t) { return isItemNew(t.updated_at || t.created_at, ts) })
    return false
  }

  function handleTabClick(tabId: TabId) {
    setActiveTab(tabId)
    setTabSeenAt(tabId)
    setSeenTimestamps(function(prev) {
      var next = Object.assign({}, prev)
      next[tabId] = Date.now()
      return next
    })
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
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-0, inherit)', marginBottom: 4 }}>{title || 'Inbox'}</h1>
      </div>

      {tabs.length > 1 && (
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border, #e5e7eb)', marginBottom: 16 }}>
          {tabs.map(function(tab) {
            var isActive = tab.id === effectiveTab
            var hasNew = tabHasNew(tab.id)
            return (
              <button
                key={tab.id}
                onClick={function() { handleTabClick(tab.id) }}
                style={{
                  fontSize: 13, padding: '8px 16px', cursor: 'pointer',
                  border: 'none', background: 'none',
                  borderBottom: isActive ? '2px solid var(--accent, #7c5cbf)' : '2px solid transparent',
                  color: isActive ? 'var(--text-0, inherit)' : 'var(--text-3, #9ca3af)',
                  fontWeight: isActive ? 600 : 400,
                  transition: 'color .15s, border-color .15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {tab.label}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 18, height: 18, borderRadius: 99,
                  fontSize: 10, fontWeight: 500, padding: '0 5px',
                  background: isActive ? 'var(--accent-bg, #EEEDFE)' : 'var(--bg-2, #f3f4f6)',
                  color: isActive ? 'var(--accent, #7c5cbf)' : 'var(--text-3, #9ca3af)',
                }}>{tab.count}</span>
                {hasNew && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c5cbf', flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>
      )}

      {effectiveTab === 'general' && <GeneralTab items={generalItems} api={api} lastSeenAt={seenTimestamps.general} />}
      {effectiveTab === 'tasks' && <TasksTab items={taskItems} api={api} onNavigate={effectiveOnNavigate} lastSeenAt={seenTimestamps.tasks} />}
      {effectiveTab === 'bugs' && <BugsTab items={bugItems} commentNotifications={bugCommentItems} onNavigate={effectiveOnNavigate} lastSeenAt={seenTimestamps.bugs} />}
      {effectiveTab === 'project' && <GeneralTab items={projectItems} api={api} lastSeenAt={seenTimestamps.project} />}
      {effectiveTab === 'reports' && <GeneralTab items={projectItems} api={api} lastSeenAt={seenTimestamps.reports} />}
      {effectiveTab === 'support' && isTeam && <SupportTabAdmin api={api} onNavigate={effectiveOnNavigate} lastSeenAt={seenTimestamps.support} onHasNew={setSupportAdminHasNew} />}
      {effectiveTab === 'support' && !isTeam && subdomain && <SupportTabPortal threads={supportThreads} api={api} subdomain={subdomain} lastSeenAt={seenTimestamps.support} />}
    </div>
  )
}

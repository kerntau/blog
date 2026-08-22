'use client'
/* eslint-disable style/max-statements-per-line */

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { createContext, useContext, useState } from 'react'
import { Icon } from '@iconify/react'
import { Alert, Button as MuiButton, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Snackbar, Switch, TextField, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material'

export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger', children: ReactNode }) {
	const muiVariant = variant === 'primary' ? 'contained' : variant === 'ghost' ? 'outlined' : 'contained'
	return <MuiButton {...props} variant={muiVariant} color={variant === 'danger' ? 'error' : 'primary'} className={`admin-button admin-button-${variant} ${className}`}>{children}</MuiButton>
}

export function AdminIconButton({ label, icon, onClick }: { label: string, icon: string, onClick: () => void }) {
	return <Tooltip title={label}><IconButton aria-label={label} onClick={onClick} size="small"><Icon icon={icon} /></IconButton></Tooltip>
}

type AdminInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'color' | 'size' | 'onChange'> & { label: string, clearable?: boolean, onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void }
interface AdminTextareaProps { label: string, value?: string, defaultValue?: string, placeholder?: string, disabled?: boolean, required?: boolean, onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void }

export function TextInput({ label, clearable, onChange, value, defaultValue, ...props }: AdminInputProps) {
	const [uncontrolledValue, setUncontrolledValue] = useState(String(defaultValue ?? ''))
	const displayedValue = value ?? uncontrolledValue
	return <TextField {...props} label={label} value={displayedValue} onChange={event => { setUncontrolledValue(event.target.value); onChange?.(event as React.ChangeEvent<HTMLInputElement>) }} fullWidth slotProps={clearable && displayedValue ? { input: { endAdornment: <InputAdornment position="end"><IconButton aria-label={`清空${label}`} size="small" onClick={() => { setUncontrolledValue(''); onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>) }}><Icon icon="tabler:x" /></IconButton></InputAdornment> } } : undefined} />
}

export function Textarea({ label, ...props }: AdminTextareaProps) {
	return <TextField {...props} label={label} multiline minRows={3} fullWidth />
}

export function ToggleSwitch({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) {
	return <label className="admin-toggle"><span>{label}</span><Switch checked={checked} onChange={event => onChange(event.target.checked)} slotProps={{ input: { 'aria-label': label } }} size="small" /></label>
}

export function SegmentedControl({ value, onChange, options }: { value: string, onChange: (value: string) => void, options: Array<{ value: string, label: string }> }) {
	return <ToggleButtonGroup value={value} exclusive size="small" className="admin-segmented" onChange={(_, next) => next && onChange(next)} aria-label="编辑器视图">{options.map(option => <ToggleButton key={option.value} value={option.value}>{option.label}</ToggleButton>)}</ToggleButtonGroup>
}

export function IconPicker({ value, onChange, icons }: { value: string, onChange: (icon: string) => void, icons: string[] }) {
	const [open, setOpen] = useState(false)
	return <div className="admin-icon-picker"><span>前台图标库</span><Button type="button" variant="ghost" onClick={() => setOpen(true)}><Icon icon={value} />选择图标</Button><small>当前：<Icon icon={value} /> {value}</small><Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="front-icon-picker-title"><DialogTitle id="front-icon-picker-title">前台图标选择器</DialogTitle><DialogContent><div role="listbox" aria-label="选择分类图标">{icons.map(icon => <IconButton key={icon} aria-label={icon} color={icon === value ? 'primary' : 'default'} onClick={() => { onChange(icon); setOpen(false) }}><Icon icon={icon} /></IconButton>)}</div></DialogContent></Dialog></div>
}

export function ImageUploader({ value, onChange }: { value: string, onChange: (value: string) => void }) {
	const inputId = 'admin-cover-upload'
	return <div className="admin-uploader" onPaste={event => { const file = event.clipboardData.files[0]; if (file) onChange(URL.createObjectURL(file)) }} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) onChange(URL.createObjectURL(file)) }}><input id={inputId} type="file" accept="image/*" onChange={event => { const file = event.target.files?.[0]; if (file) onChange(URL.createObjectURL(file)) }} /><Icon icon="tabler:photo-up" />{value ? <><img src={value} alt="封面预览" /><Button type="button" variant="danger" onClick={() => onChange('')}>移除封面</Button></> : <label htmlFor={inputId}>拖放、粘贴或选择封面图片</label>}</div>
}

interface ToastApi { show: (message: string) => void }
const ToastContext = createContext<ToastApi>({ show: () => undefined })
export function ToastProvider({ children }: { children: ReactNode }) {
	const [message, setMessage] = useState('')
	function show(nextMessage: string) { setMessage(nextMessage); window.setTimeout(() => setMessage(''), 3500) }
	return <ToastContext.Provider value={{ show }}>{children}<Snackbar open={Boolean(message)} autoHideDuration={3500} onClose={() => setMessage('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert severity="success" variant="filled">{message}</Alert></Snackbar></ToastContext.Provider>
}
export function useToast() { return useContext(ToastContext) }

export function StatusBadge({ status }: { status: 'published' | 'draft' | 'warning' | 'error' }) { const labels = { published: '已发布', draft: '草稿', warning: '待处理', error: '异常' }; return <span className={`admin-status ${status}`}><i />{labels[status]}</span> }
export function EmptyState({ title, description, action }: { title: string, description: string, action?: ReactNode }) { return <section className="admin-empty"><Icon icon="tabler:inbox" /><h2>{title}</h2><p>{description}</p>{action}</section> }
export function ConfirmButton({ label, title, description, onConfirm, variant = 'danger' }: { label: string, title: string, description: string, onConfirm: () => void, variant?: 'danger' | 'primary' }) { const [open, setOpen] = useState(false); return <><Button type="button" variant={variant} onClick={() => setOpen(true)}>{label}</Button><Dialog open={open} onClose={() => setOpen(false)} aria-labelledby="admin-confirm-title"><DialogTitle id="admin-confirm-title">{title}</DialogTitle><DialogContent>{description}</DialogContent><DialogActions><Button type="button" variant="ghost" onClick={() => setOpen(false)}>取消</Button><Button type="button" variant={variant} onClick={() => { onConfirm(); setOpen(false) }}>确认</Button></DialogActions></Dialog></> }

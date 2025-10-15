import clsx from 'clsx'
import React, { forwardRef, useCallback, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { validateProps, VALIDATION_RULES, sanitizeHtml } from '../../utils/validation'
import styles from './Modal.module.css'

// Bundled configuration props
interface ModalConfig {
	size?: 'sm' | 'md' | 'lg' | 'xl'
	showCloseButton?: boolean
	closeOnBackdropClick?: boolean
	closeOnEscape?: boolean
}

// Type alias for better readability
type ModalProps = {
	// Required data props
	isOpen: boolean
	onClose: () => void
	// Optional data props
	title?: string
	children: React.ReactNode
	// UI state props
	config?: ModalConfig
	className?: string
}

// Prop validation for Modal
const validateModalProps = (props: ModalProps, componentName: string) => {
	return validateProps(props, {
		isOpen: VALIDATION_RULES.required,
		onClose: VALIDATION_RULES.eventHandler,
		title: VALIDATION_RULES.string,
		children: VALIDATION_RULES.required
	}, componentName)
}

// Define default config
const defaultModalConfig: Required<ModalConfig> = {
	size: 'md',
	showCloseButton: true,
	closeOnBackdropClick: true,
	closeOnEscape: true
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
	(
		{
			isOpen,
			onClose,
			title,
			children,
			config = {},
			className
		},
		_ref
	) => {
		// Validate props in development
		if (process.env.NODE_ENV === 'development') {
			validateModalProps({ isOpen, onClose, title, children, config, className }, 'Modal')
		}

		// Merge config with defaults
		const {
			size,
			showCloseButton,
			closeOnBackdropClick,
			closeOnEscape
		} = { ...defaultModalConfig, ...config }

		// Sanitize title to prevent XSS
		const sanitizedTitle = title ? sanitizeHtml(title) : undefined
		const modalRef = useRef<HTMLDivElement>(null)
		const previousFocusRef = useRef<HTMLElement | null>(null)
		const titleId = useId()

		const handleEscape = useCallback((event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose()
			}
		}, [onClose])

		useEffect(() => {
			if (isOpen) {
				// Store previous focus
				previousFocusRef.current = document.activeElement as HTMLElement

				// Focus the modal
				if (modalRef.current) {
					modalRef.current.focus()
				}

				// Prevent body scroll
				document.body.classList.add('modal-open')

				// Add escape key listener if needed
				if (closeOnEscape) {
					document.addEventListener('keydown', handleEscape)
				}
			}

			// Always return a cleanup function
			return () => {
				if (closeOnEscape) {
					document.removeEventListener('keydown', handleEscape)
				}
				// Restore body scroll
				document.body.classList.remove('modal-open')
				// Restore focus
				if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
					previousFocusRef.current.focus()
				}
			}
		}, [isOpen, closeOnEscape, handleEscape])

		const handleBackdropClick = useCallback((event: React.MouseEvent) => {
			if (closeOnBackdropClick && event.target === event.currentTarget) {
				onClose()
			}
		}, [closeOnBackdropClick, onClose])

		if (!isOpen) {
			return null
		}

		const modalContent = (
			<div
				className={styles.overlay}
				onClick={handleBackdropClick}
				onKeyDown={handleEscape}
				role='dialog'
				aria-modal='true'
				aria-labelledby={title ? titleId : undefined}
			>
				<div ref={modalRef} className={clsx(styles.modal, styles[size], className)} tabIndex={-1}>
					{(sanitizedTitle || showCloseButton) && (
						<div className={styles.header}>
							{sanitizedTitle && (
								<h2 id={titleId} className={styles.title}>
									{sanitizedTitle}
								</h2>
							)}
							{showCloseButton && (
								<button type='button' className={styles.closeButton} onClick={onClose} aria-label='Close modal'>
									<svg width='16' height='16' viewBox='0 0 16 16' fill='none' aria-hidden='true'>
										<title>Close</title>
										<path
											d='M12 4L4 12M4 4L12 12'
											stroke='currentColor'
											strokeWidth='1.5'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								</button>
							)}
						</div>
					)}
					<div className={styles.content}>{children}</div>
				</div>
			</div>
		)

		// Use portal to render at document body level
		return createPortal(modalContent, document.body)
	}
)

Modal.displayName = 'Modal'

// Wrap with React.memo for performance optimization with custom comparison
const MemoizedModal = React.memo(Modal, (prevProps, nextProps) => {
	// Custom comparison for better memoization
	return (
		prevProps.isOpen === nextProps.isOpen &&
		prevProps.title === nextProps.title &&
		prevProps.className === nextProps.className &&
		prevProps.children === nextProps.children &&
		JSON.stringify(prevProps.config) === JSON.stringify(nextProps.config)
	)
})

export { MemoizedModal as Modal }

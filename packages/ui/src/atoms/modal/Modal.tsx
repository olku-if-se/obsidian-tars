import clsx from 'clsx'
import type React from 'react'
import { forwardRef, useCallback, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

type ModalProps = {
	isOpen: boolean
	onClose: () => void
	title?: string
	children: React.ReactNode
	size?: 'sm' | 'md' | 'lg' | 'xl'
	showCloseButton?: boolean
	closeOnBackdropClick?: boolean
	closeOnEscape?: boolean
	className?: string
}

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
	({
		isOpen,
		onClose,
		title,
		children,
		size = 'md',
		showCloseButton = true,
		closeOnBackdropClick = true,
		closeOnEscape = true,
		className
	}, _ref) => {
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
				onKeyDown={undefined}
				role='dialog'
				aria-modal='true'
				aria-labelledby={title ? titleId : undefined}
			>
				<div ref={modalRef} className={clsx(styles.modal, styles[size], className)} tabIndex={-1}>
					{(title || showCloseButton) && (
						<div className={styles.header}>
							{title && (
								<h2 id={titleId} className={styles.title}>
									{title}
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
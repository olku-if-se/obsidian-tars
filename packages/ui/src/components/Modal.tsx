import { forwardRef, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './Modal.module.css'

interface ModalProps {
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
	(
		{
			isOpen,
			onClose,
			title,
			children,
			size = 'md',
			showCloseButton = true,
			closeOnBackdropClick = true,
			closeOnEscape = true,
			className = ''
		},
		_ref
	) => {
		const modalRef = useRef<HTMLDivElement>(null)
		const previousFocusRef = useRef<HTMLElement | null>(null)
		const titleId = useId()

		useEffect(() => {
			let handleEscape: ((event: KeyboardEvent) => void) | null = null

			if (isOpen) {
				// Store previous focus
				previousFocusRef.current = document.activeElement as HTMLElement

				// Focus the modal
				if (modalRef.current) {
					modalRef.current.focus()
				}

				// Prevent body scroll
				document.body.style.overflow = 'hidden'

				// Add escape key listener if needed
				if (closeOnEscape) {
					handleEscape = (event: KeyboardEvent) => {
						if (event.key === 'Escape') {
							onClose()
						}
					}
					document.addEventListener('keydown', handleEscape)
				}
			}

			// Always return a cleanup function
			return () => {
				if (handleEscape) {
					document.removeEventListener('keydown', handleEscape)
				}
				// Restore body scroll
				document.body.style.overflow = ''
				// Restore focus
				if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
					previousFocusRef.current.focus()
				}
			}
		}, [isOpen, onClose, closeOnEscape])

		const handleBackdropClick = (event: React.MouseEvent) => {
			if (closeOnBackdropClick && event.target === event.currentTarget) {
				onClose()
			}
		}

		if (!isOpen) {
			return null
		}

		const modalContent = (
			<div
				className={styles.overlay}
				onClick={handleBackdropClick}
				role='dialog'
				aria-modal='true'
				aria-labelledby={title ? titleId : undefined}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						onClose()
					}
				}}
			>
				<div ref={modalRef} className={`${styles.modal} ${styles[size]} ${className}`} tabIndex={-1}>
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

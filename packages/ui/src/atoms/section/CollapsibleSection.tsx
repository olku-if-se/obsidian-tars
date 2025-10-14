import { useState } from 'react'
import clsx from 'clsx'
import styles from './CollapsibleSection.module.css'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void | Promise<void>
  children: React.ReactNode
  className?: string
}

export const CollapsibleSection = ({
  title,
  defaultOpen = false,
  onToggle,
  children,
  className
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = async () => {
    const newOpen = !isOpen
    setIsOpen(newOpen)
    if (onToggle) {
      try {
        await onToggle(newOpen)
      } catch (error) {
        // Revert on error
        setIsOpen(!newOpen)
      }
    }
  }

  return (
    <details
      className={clsx(styles.collapsible, className)}
      open={isOpen}
      onToggle={handleToggle}
    >
      <summary className={styles.summary}>
        <span className={styles.summaryText}>{title}</span>
        <span className={clsx(styles.arrow, isOpen && styles.arrowOpen)}>
          ▼
        </span>
      </summary>
      <div className={styles.content}>
        {children}
      </div>
    </details>
  )
}
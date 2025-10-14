import clsx from 'clsx'
import styles from './SettingRow.module.css'

interface SettingRowProps {
  name: string
  description?: string
  children: React.ReactNode
  className?: string
  vertical?: boolean // New prop for top/bottom layout instead of left/right
}

export const SettingRow = ({
  name,
  description,
  children,
  className,
  vertical = false
}: SettingRowProps) => {
  return (
    <div className={clsx(
      styles.settingRow,
      vertical && styles.vertical,
      className
    )}>
      <div className={styles.settingInfo}>
        <div className={styles.settingName}>{name}</div>
        {description && (
          <div className={styles.settingDescription}>{description}</div>
        )}
      </div>
      <div className={styles.settingControl}>
        {children}
      </div>
    </div>
  )
}
import clsx from 'clsx'
import styles from './Section.module.css'

interface SectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export const Section = ({ title, children, className }: SectionProps) => {
  return (
    <section className={clsx(styles.section, className)}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionContent}>
        {children}
      </div>
    </section>
  )
}
import { forwardRef } from 'react';
import styles from './Input.module.css';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
	label?: string;
	error?: string;
	size?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, size = 'md', className, id, ...props }, ref) => {
		const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

		return (
			<div className={`${styles.inputWrapper} ${styles[size]} ${className || ''}`}>
				{label && (
					<label htmlFor={inputId} className={styles.label}>
						{label}
					</label>
				)}
				<input
					ref={ref}
					id={inputId}
					className={`${styles.input} ${error ? styles.error : ''}`}
					{...props}
				/>
				{error && <div className={styles.errorText}>{error}</div>}
			</div>
		);
	}
);

Input.displayName = 'Input';

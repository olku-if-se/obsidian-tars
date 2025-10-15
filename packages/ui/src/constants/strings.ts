// Centralized string constants for UI text
// These will be replaced with i18n when ready

export const COMMON_STRINGS = {
	// Actions
	ACTION: {
		SAVE: 'Save',
		CANCEL: 'Cancel',
		DELETE: 'Delete',
		EDIT: 'Edit',
		CLOSE: 'Close',
		COPY: 'Copy',
		CLEAR: 'Clear',
		CONFIRM: 'Confirm',
		RETRY: 'Retry',
		DISMISS: 'Dismiss'
	},

	// States
	STATE: {
		LOADING: 'Loading...',
		SUCCESS: 'Success',
		ERROR: 'Error',
		WARNING: 'Warning',
		INFO: 'Info',
		IDLE: 'Ready'
	},

	// Form labels
	FORM: {
		REQUIRED: 'Required',
		OPTIONAL: 'Optional',
		INVALID: 'Invalid input',
		INVALID_EMAIL: 'Invalid email address',
		INVALID_URL: 'Invalid URL',
		TOO_SHORT: 'Too short',
		TOO_LONG: 'Too long',
		REQUIRED_FIELD: 'This field is required'
	},

	// Navigation
	NAV: {
		BACK: 'Back',
		NEXT: 'Next',
		PREVIOUS: 'Previous',
		HOME: 'Home',
		SETTINGS: 'Settings',
		HELP: 'Help'
	},

	// Messages
	MESSAGE: {
		NO_DATA: 'No data available',
		NO_RESULTS: 'No results found',
		EMPTY_STATE: 'Nothing to show here',
		NETWORK_ERROR: 'Network error occurred',
		UNKNOWN_ERROR: 'An unknown error occurred',
		SUCCESS_SAVED: 'Successfully saved',
		SUCCESS_DELETED: 'Successfully deleted',
		CONFIRM_DELETE: 'Are you sure you want to delete this item?'
	}
} as const

export const ERROR_STRINGS = {
	// Error types
	TYPES: {
		VALIDATION: 'Validation Error',
		NETWORK: 'Network Error',
		PERMISSION: 'Permission Error',
		TIMEOUT: 'Request Timeout',
		SERVER: 'Server Error',
		UNKNOWN: 'Unknown Error'
	},

	// Common error messages
	MESSAGES: {
		NETWORK_OFFLINE: 'You appear to be offline',
		REQUEST_FAILED: 'Request failed',
		UNAUTHORIZED: 'You are not authorized to perform this action',
		FORBIDDEN: 'Access forbidden',
		NOT_FOUND: 'The requested resource was not found',
		SERVER_ERROR: 'Server error occurred',
		TIMEOUT: 'Request timed out',
		INVALID_RESPONSE: 'Invalid response from server'
	}
} as const

export const STATUS_STRINGS = {
	// Status descriptions
	DESCRIPTIONS: {
		IDLE: 'Ready',
		GENERATING: 'Generating...',
		SUCCESS: 'Operation completed successfully',
		ERROR: 'An error occurred',
		WARNING: 'Warning',
		INFO: 'Information'
	},

	// Duration estimates
	DURATION: {
		INSTANT: 'Just now',
		SECONDS: '{{count}} seconds ago',
		MINUTE: '1 minute ago',
		MINUTES: '{{count}} minutes ago',
		HOUR: '1 hour ago',
		HOURS: '{{count}} hours ago',
		DAY: 'Yesterday',
		DAYS: '{{count}} days ago',
		WEEK: '1 week ago',
		WEEKS: '{{count}} weeks ago'
	}
} as const

// Utility function to get placeholder text for i18n
export const getPlaceholderText = (key: string, fallback?: string): string => {
	// This will be replaced with actual i18n in the future
	return fallback || key.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || key
}

// Type-safe string getter
export function getString<T extends Record<string, any>>(
	obj: T,
	path: string
): string {
	return path.split('.').reduce((acc: any, key) => acc?.[key], obj) || ''
}
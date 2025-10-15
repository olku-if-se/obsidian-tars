# Security Best Practices for @tars/ui

This document outlines security best practices implemented in the UI component library.

## 🛡️ Security Measures Implemented

### 1. Prop Validation
- **Runtime validation** in development mode for all component props
- **Type guards** for common prop types (strings, React nodes, URLs)
- **Automatic warnings** for invalid props using `console.warn`

### 2. XSS Prevention
- **HTML sanitization** for all user-provided content using `sanitizeHtml()`
- **Dangerous attribute filtering** - `dangerouslySetInnerHTML` is automatically removed
- **URL validation** for links and navigation

### 3. Input Validation
- **Safe HTML rendering** - all HTML content is sanitized
- **Event handler validation** - ensures only functions are passed as event handlers
- **Children validation** - prevents dangerous content injection

### 4. Accessibility Security
- **ARIA label validation** - ensures labels are safe and appropriate length
- **Safe aria attributes** - validates accessibility attributes

## 🔒 Security Utilities

### `validateProps()`
Validates component props against defined rules and warns in development.

```typescript
validateProps(props, {
  title: VALIDATION_RULES.string,
  onClick: VALIDATION_RULES.eventHandler
}, 'ComponentName')
```

### `sanitizeHtml()`
Removes dangerous HTML content to prevent XSS attacks.

```typescript
const cleanHtml = sanitizeHtml(userProvidedHtml)
```

### `validateUrl()`
Ensures URLs use safe protocols only.

```typescript
if (validateUrl(userUrl)) {
  // Safe to render
}
```

## 🚨 Security Rules

### DO
- ✅ Validate all user inputs
- ✅ Sanitize HTML content
- ✅ Use safe URL protocols (http, https, mailto, tel)
- ✅ Validate event handlers
- ✅ Filter dangerous attributes

### DON'T
- ❌ Render raw HTML without sanitization
- ❌ Allow `javascript:` URLs
- ❌ Pass unvalidated user content to props
- ❌ Use `dangerouslySetInnerHTML` without sanitization
- ❌ Skip prop validation in development

## 🧪 Testing Security

All components include security tests:
- XSS prevention tests
- Prop validation tests
- Safe rendering tests
- Accessibility security tests

## 📋 Security Checklist

When creating new components:

1. [ ] Add prop validation for all user-provided props
2. [ ] Sanitize any HTML content
3. [ ] Validate URLs and links
4. [ ] Filter dangerous attributes
5. [ ] Add security tests
6. [ ] Document any security considerations

## 🔄 Security Updates

Security is treated as a first-class concern:
- Regular security audits
- Dependency updates for security patches
- Automated security testing in CI/CD
- Documentation of security best practices

## 🚨 Reporting Security Issues

If you discover a security vulnerability:
1. Do not open a public issue
2. Send details to the maintainers privately
3. Include steps to reproduce
4. Wait for confirmation before disclosure
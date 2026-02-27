# Variable Substitution

## Overview

Gostman supports variable substitution using the double curly brace syntax `{{variable_name}}`. This allows you to define reusable values in one place and reference them throughout your requests.

## Syntax

Variables are substituted using the `{{variable_name}}` syntax:

```json
{
  "base_url": "https://api.example.com",
  "api_key": "your-api-key-here",
  "user_id": "12345"
}
```

### Usage Examples

**URL Substitution:**
```
Input:  {{base_url}}/users/{{user_id}}
Output: https://api.example.com/users/12345
```

**Header Substitution:**
```json
Input:  {"Authorization": "Bearer {{api_key}}"}
Output: {"Authorization": "Bearer your-api-key-here"}
```

**Body Substitution:**
```json
Input:  {"url": "{{base_url}}/ping", "key": "{{api_key}}"}
Output: {"url": "https://api.example.com/ping", "key": "your-api-key-here"}
```

## Rules

1. **Exact Match**: Variable names must match exactly (case-sensitive)
2. **Whitespace**: Whitespace inside braces is trimmed: `{{ name }}` == `{{name}}`
3. **Non-existent Keys**: If a variable is not found, the placeholder remains unchanged
4. **Multiple Occurrences**: All occurrences of a placeholder are replaced
5. **Nested Placeholders**: Not supported - nested braces like `{{{{var}}}}` are not recognized

## Scope

Variables are applied to:
- Request URL
- Query parameters
- Headers
- Request body
- GraphQL queries
- GraphQL variables

## Variable Naming

**Naming conventions** (recommended patterns, not enforced):
- alphanumeric characters: `a-z, A-Z, 0-9`
- underscores: `_`
- hyphens: `-`

**Note**: The implementation does not enforce naming rules. Any key that can be stored in the variables map will be substituted correctly. The following conventions are recommended for consistency and readability:

Recommended examples:
- ✅ `api_key`
- ✅ `API_KEY`
- ✅ `base-url`
- ✅ `_internal`

Also technically works (but not recommended):
- `123var` (numbers in keys work fine)
- `user.name` (dots work if defined in the variables map)

## Implementation

### JavaScript Version
- **File**: `gostman-gui/frontend/src/lib/variables.js`
- **Function**: `substitute(text, variables)`
- **Pattern**: `/\{\{([^}]+)\}\}/g`

### Go Version
- **File**: `gostman-gui/app.go`
- **Function**: `replacePlaceholders(input string, variables map[string]string)`
- **Pattern**: `regexp.MustCompile({{(.*?)}})`

Both implementations:
- Trim whitespace from variable names
- Replace all occurrences
- Keep unknown placeholders unchanged
- Handle empty/undefined variables gracefully

## Testing

### JavaScript Tests
```bash
cd gostman-gui/frontend
npm test -- variables.test.js
```

### Go Tests
```bash
cd gostman-gui
go test -v -run TestReplacePlaceholders
```

## Examples

### Complete Request Example

**Environment Variables:**
```json
{
  "host": "https://api.github.com",
  "token": "ghp_your_token_here",
  "username": "octocat"
}
```

**Request using variables:**
- **URL**: `{{host}}/users/{{username}}/repos`
- **Headers**: `{"Authorization": "Bearer {{token}}", "Accept": "application/json"}`
- **Body**: (empty for GET request)

**After substitution:**
- **URL**: `https://api.github.com/users/octocat/repos`
- **Headers**: `{"Authorization": "Bearer ghp_your_token_here", "Accept": "application/json"}`

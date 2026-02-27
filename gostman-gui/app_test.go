package main

import (
	"testing"
)

// TestReplacePlaceholders tests the variable substitution function
func TestReplacePlaceholders(t *testing.T) {
	tests := []struct {
		name      string
		input     string
		variables map[string]string
		expected  string
	}{
		{
			name:     "basic substitution",
			input:    "Hello {{name}}",
			variables: map[string]string{"name": "World"},
			expected: "Hello World",
		},
		{
			name:     "multiple substitutions",
			input:    "{{greeting}} {{name}}",
			variables: map[string]string{"greeting": "Hello", "name": "World"},
			expected: "Hello World",
		},
		{
			name:     "whitespace handling",
			input:    "Hello {{ name }}",
			variables: map[string]string{"name": "World"},
			expected: "Hello World",
		},
		{
			name:     "extra whitespace",
			input:    "Hello {{  name  }}",
			variables: map[string]string{"name": "World"},
			expected: "Hello World",
		},
		{
			name:     "missing variable",
			input:    "Hello {{missing}}",
			variables: map[string]string{"other": "value"},
			expected: "Hello {{missing}}",
		},
		{
			name:     "url substitution",
			input:    "{{base_url}}/users/{{id}}",
			variables: map[string]string{"base_url": "https://api.example.com", "id": "42"},
			expected: "https://api.example.com/users/42",
		},
		{
			name:     "empty variables",
			input:    "Hello {{name}}",
			variables: nil,
			expected: "Hello {{name}}",
		},
		{
			name:     "empty string input",
			input:    "",
			variables: map[string]string{"key": "value"},
			expected: "",
		},
		{
			name:     "multiple occurrences",
			input:    "{{name}} is {{name}}",
			variables: map[string]string{"name": "test"},
			expected: "test is test",
		},
		{
			name:     "consecutive placeholders",
			input:    "{{a}}{{b}}",
			variables: map[string]string{"a": "1", "b": "2"},
			expected: "12",
		},
		{
			name:     "underscores in variable name",
			input:    "{{api_key}}",
			variables: map[string]string{"api_key": "secret"},
			expected: "secret",
		},
		{
			name:     "hyphens in variable name",
			input:    "{{api-key}}",
			variables: map[string]string{"api-key": "secret"},
			expected: "secret",
		},
		{
			name:     "numbers in variable name",
			input:    "{{var1}}",
			variables: map[string]string{"var1": "value"},
			expected: "value",
		},
		{
			name:     "special characters in value",
			input:    "{{value}}",
			variables: map[string]string{"value": "a/b/c?d=e&f=g"},
			expected: "a/b/c?d=e&f=g",
		},
		{
			name:     "JSON string substitution",
			input:    `{"url": "{{base_url}}", "key": "{{api_key}}"}`,
			variables: map[string]string{"base_url": "https://api.example.com", "api_key": "secret"},
			expected: `{"url": "https://api.example.com", "key": "secret"}`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := replacePlaceholders(tt.input, tt.variables)
			if result != tt.expected {
				t.Errorf("replacePlaceholders() = %v, want %v", result, tt.expected)
			}
		})
	}
}

// TestReplacePlaceholdersEdgeCases tests edge cases
func TestReplacePlaceholdersEdgeCases(t *testing.T) {
	t.Run("empty value should replace placeholder", func(t *testing.T) {
		result := replacePlaceholders("Hello {{name}}", map[string]string{"name": ""})
		expected := "Hello "
		if result != expected {
			t.Errorf("replacePlaceholders() = %v, want %v", result, expected)
		}
	})

	t.Run("nested braces", func(t *testing.T) {
		result := replacePlaceholders("{{{{}}}", map[string]string{"{{}}": "value"})
		// Nested braces aren't supported - the placeholder remains unchanged
		expected := "{{{{}}}" // No valid variable to replace
		if result != expected {
			t.Errorf("replacePlaceholders() = %v, want %v", result, expected)
		}
	})

	t.Run("incomplete braces", func(t *testing.T) {
		result := replacePlaceholders("Hello {{name", map[string]string{"name": "World"})
		expected := "Hello {{name"
		if result != expected {
			t.Errorf("replacePlaceholders() = %v, want %v", result, expected)
		}
	})

	t.Run("braces with spaces inside", func(t *testing.T) {
		result := replacePlaceholders("Hello {{ name }}", map[string]string{"name": "World"})
		expected := "Hello World"
		if result != expected {
			t.Errorf("replacePlaceholders() = %v, want %v", result, expected)
		}
	})
}

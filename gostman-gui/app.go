package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"

	"github.com/google/uuid"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Data Structures

type SavedData struct {
	Variables string    `json:"variables"`
	Requests  []Request `json:"requests"`
}

type Request struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	URL         string `json:"url"`
	Method      string `json:"method"`
	Headers     string `json:"headers"`
	Body        string `json:"body"`
	QueryParams string `json:"queryParams"`
	Response    string `json:"response"`
}

// Globals
var appFolder = getAppDataPath()
var jsonfilePath = filepath.Join(appFolder, "gostman.json")

// Helper Functions

func getAppDataPath() string {
	if runtime.GOOS == "windows" {
		return filepath.Join(os.Getenv("APPDATA"), "Gostman")
	}
	// Linux and macOS path: ~/.local/share/Gostman
	return filepath.Join(os.Getenv("HOME"), ".local", "share", "Gostman")
}

func checkFileExists(filepath string) bool {
	_, err := os.Stat(filepath)
	return errors.Is(err, os.ErrNotExist)
}

func replacePlaceholders(url string, variables map[string]string) string {
	re := regexp.MustCompile(`{{(.*?)}}`)
	return re.ReplaceAllStringFunc(url, func(match string) string {
		key := strings.Trim(match, "{}") // Extract key name
		if value, exists := variables[key]; exists {
			return value
		}
		return match // Keep original placeholder if key not found
	})
}

// Exported Methods (Callable from JS)

type ResponseMsg struct {
	Body   string `json:"body"`
	Status string `json:"status"`
}

func (a *App) SendRequest(method, urlStr, headersJSON, bodyStr, paramsJSON string) ResponseMsg {
	// Load variables first
	variablesJSON := a.GetVariables()
	var variables map[string]string
	if err := json.Unmarshal([]byte(variablesJSON), &variables); err != nil {
		return ResponseMsg{Body: "\n Error parsing Env Variables", Status: "Incorrect Env Variables"}
	}

	// Replace placeholders
	urlStr = replacePlaceholders(urlStr, variables)
	headersJSON = replacePlaceholders(headersJSON, variables)
	paramsJSON = replacePlaceholders(paramsJSON, variables)
	bodyStr = replacePlaceholders(bodyStr, variables)

	// Parse Headers
	var headers map[string]string
	if err := json.Unmarshal([]byte(headersJSON), &headers); err != nil {
		return ResponseMsg{Body: " \n Error parsing Headers \n\n Correct the Headers format", Status: " Incorrect Headers "}
	}

	// Parse Params and append to URL
	if paramsJSON != "" {
		var params map[string]string
		if err := json.Unmarshal([]byte(paramsJSON), &params); err != nil {
			return ResponseMsg{Body: " \n Error parsing Params \n\n Correct the Params format", Status: " Incorrect Params "}
		}

		parsedURL, err := url.Parse(urlStr)
		if err != nil {
			return ResponseMsg{Body: " \n Error parsing URL \n\n Correct the URL format", Status: " Incorrect URL "}
		}

		q := parsedURL.Query()
		for key, value := range params {
			q.Set(key, value)
		}
		parsedURL.RawQuery = q.Encode()
		urlStr = parsedURL.String()
	}

	method = strings.ToUpper(strings.TrimSpace(method))

	var req *http.Request
	var err error
	client := &http.Client{}

	switch method {
	case "GET", "DELETE", "HEAD":
		req, err = http.NewRequest(method, urlStr, nil)
	case "POST", "PUT", "PATCH":
		req, err = http.NewRequest(method, urlStr, bytes.NewBuffer([]byte(bodyStr)))
	default:
		return ResponseMsg{Body: "Request Method is set incorrectly", Status: " Incorrect Request "}
	}

	if err != nil {
		return ResponseMsg{Body: "Failed to make request\n\n" + err.Error(), Status: "Error"}
	}

	// Set headers
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	// Execute request
	resp, err := client.Do(req)
	if err != nil {
		return ResponseMsg{Body: "Failed to make request\n\n" + err.Error(), Status: "Error"}
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return ResponseMsg{Body: "Failed to read response body\n\n" + err.Error(), Status: "Error"}
	}

	return ResponseMsg{Body: string(bodyBytes), Status: resp.Status}
}

func (a *App) GetRequests() []Request {
	if !checkFileExists(jsonfilePath) {
		return []Request{}
	}

	file, err := os.ReadFile(jsonfilePath)
	if err != nil {
		log.Println("Error reading file:", err)
		return []Request{}
	}

	var saved_data SavedData
	if len(file) > 0 {
		json.Unmarshal(file, &saved_data)
	}
	return saved_data.Requests
}

func (a *App) SaveRequest(r Request) string {
	if checkFileExists(jsonfilePath) {
		if err := os.MkdirAll(appFolder, os.ModePerm); err != nil {
			return fmt.Sprintf("Failed to create directory: %v", err)
		}
	} else {
		// Ensure directory exists even if file doesn't
		if err := os.MkdirAll(appFolder, os.ModePerm); err != nil {
			return fmt.Sprintf("Failed to create directory: %v", err)
		}
        // Initialize file if not exists
        if _, err := os.Create(jsonfilePath); err != nil {
             return fmt.Sprintf("Failed to create file: %v", err)
        }
    }

	file, err := os.ReadFile(jsonfilePath)
	if err != nil {
		return fmt.Sprintf("Error reading file: %v", err)
	}

	var saved_data SavedData
    if len(file) > 0 {
	    json.Unmarshal(file, &saved_data)
    }

	savedRequests := saved_data.Requests

	if r.Id == "" {
		r.Id = uuid.New().String()
		savedRequests = append(savedRequests, r)
	} else {
		found := false
		for i, savedReq := range savedRequests {
			if savedReq.Id == r.Id {
				savedRequests[i] = r
				found = true
				break
			}
		}
		if !found {
			savedRequests = append(savedRequests, r)
		}
	}

	saved_data.Requests = savedRequests

	updatedData, err := json.MarshalIndent(saved_data, "", " ")
	if err != nil {
		return fmt.Sprintf("Error encoding JSON data: %v", err)
	}

	if err := os.WriteFile(jsonfilePath, updatedData, 0644); err != nil {
		return fmt.Sprintf("failed to save request: %v", err)
	}
	return "Request Saved Successfully"
}

func (a *App) DeleteRequest(id string) error {
	file, err := os.ReadFile(jsonfilePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	var saved_data SavedData
    if len(file) > 0 {
	    if err := json.Unmarshal(file, &saved_data); err != nil {
		    return fmt.Errorf("failed to parse JSON: %w", err)
    	}
    }

	requests := saved_data.Requests
	index := -1
	for i, req := range requests {
		if req.Id == id {
			index = i
			break
		}
	}

	if index == -1 {
		return fmt.Errorf("id not found: %s", id)
	}

	saved_data.Requests = append(requests[:index], requests[index+1:]...)

	updatedData, err := json.MarshalIndent(saved_data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to encode JSON: %w", err)
	}

	if err := os.WriteFile(jsonfilePath, updatedData, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}

	return nil
}

func (a *App) GetVariables() string {
	if !checkFileExists(jsonfilePath) {
		return "{}"
	}
	file, err := os.ReadFile(jsonfilePath)
	if err != nil {
		return "{}"
	}
	var saved_data SavedData
    if len(file) > 0 {
    	json.Unmarshal(file, &saved_data)
    }
    if saved_data.Variables == "" {
        return "{}"
    }
	return saved_data.Variables
}

func (a *App) SaveVariables(variableString string) string {
    // Validate JSON first
	var variables map[string]string
	if err := json.Unmarshal([]byte(variableString), &variables); err != nil {
		return "Error parsing Environment Variables, JSON structure is incorrect"
	}

    if err := os.MkdirAll(appFolder, os.ModePerm); err != nil {
         return fmt.Sprintf("Failed to create directory: %v", err)
    }

    // Logic similar to SaveRequest, load existing, update variables, save back.
    // NOTE: Simplified here to reusing existing logic pattern
    
	file, _ := os.ReadFile(jsonfilePath) // Ignore error if file doesn't exist, we will create/rewrite

	var saved_data SavedData
    if len(file) > 0 {
    	json.Unmarshal(file, &saved_data)
    }

	saved_data.Variables = variableString

	updatedData, err := json.MarshalIndent(saved_data, "", " ")
	if err != nil {
		return fmt.Sprintf("Error encoding JSON data: %v", err)
	}

	if err := os.WriteFile(jsonfilePath, updatedData, 0644); err != nil {
		return "Failed to save variables"
	}

	return "Environment Variables Saved Sucessfully"
}

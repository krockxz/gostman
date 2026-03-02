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
	"sync"
	"time"

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

type ResponseMsg struct {
	Body   string `json:"body"`
	Status string `json:"status"`
}

// Globals
var appFolder = getAppDataPath()
var jsonfilePath = filepath.Join(appFolder, "gostman.json")
var dataMutex sync.RWMutex

// --- Helper Functions (Private) ---

func getAppDataPath() string {
	if runtime.GOOS == "windows" {
		return filepath.Join(os.Getenv("APPDATA"), "Gostman")
	}
	// Linux and macOS path: ~/.local/share/Gostman
	return filepath.Join(os.Getenv("HOME"), ".local", "share", "Gostman")
}

func checkFileExists(filepath string) bool {
	_, err := os.Stat(filepath)
	return !errors.Is(err, os.ErrNotExist)
}

// getSavedData loads the entire data structure from disk.
// It returns an empty SavedData if the file doesn't exist or errors.
func getSavedData() SavedData {
	dataMutex.RLock()
	defer dataMutex.RUnlock()

	if !checkFileExists(jsonfilePath) {
		return SavedData{}
	}
	file, err := os.ReadFile(jsonfilePath)
	if err != nil {
		log.Println("Error reading file:", err)
		return SavedData{}
	}
	var data SavedData
	if len(file) > 0 {
		err = json.Unmarshal(file, &data)
		if err != nil {
			log.Println("Error unmarshaling file data:", err)
		}
	}
	return data
}

// saveSavedData persists the data structure to disk.
func saveSavedData(data SavedData) error {
	dataMutex.Lock()
	defer dataMutex.Unlock()

	if err := os.MkdirAll(appFolder, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	updatedData, err := json.MarshalIndent(data, "", " ")
	if err != nil {
		return fmt.Errorf("failed to encode JSON: %w", err)
	}

	if err := os.WriteFile(jsonfilePath, updatedData, 0644); err != nil {
		return fmt.Errorf("failed to write file: %w", err)
	}
	return nil
}

func replacePlaceholders(input string, variables map[string]string) string {
	re := regexp.MustCompile(`{{(.*?)}}`)
	return re.ReplaceAllStringFunc(input, func(match string) string {
		key := strings.Trim(match, "{}")
		key = strings.TrimSpace(key) // Trim whitespace from the key
		if value, exists := variables[key]; exists {
			return value
		}
		return match
	})
}

// --- Exported Methods (Callable from JS) ---

func (a *App) SendRequest(method, urlStr, headersJSON, bodyStr, paramsJSON string) ResponseMsg {
	// Handle GraphQL requests - convert to POST with JSON body
	if method == "GRAPHQL" {
		method = "POST"
		// Format GraphQL request
		var graphqlReq struct {
			Query     string `json:"query"`
			Variables any    `json:"variables"`
		}
		graphqlReq.Query = bodyStr

		// Parse variables if provided
		var vars map[string]any
		if err := json.Unmarshal([]byte(paramsJSON), &vars); err == nil {
			graphqlReq.Variables = vars
		}

		formattedBody, err := json.Marshal(graphqlReq)
		if err == nil {
			bodyStr = string(formattedBody)
		}

		// Ensure Content-Type header is set
		var headers map[string]string
		if err := json.Unmarshal([]byte(headersJSON), &headers); err == nil {
			if headers["Content-Type"] == "" {
				headers["Content-Type"] = "application/json"
			}
			updatedHeaders, _ := json.Marshal(headers)
			headersJSON = string(updatedHeaders)
		} else {
			return ResponseMsg{Body: fmt.Sprintf("Error parsing GraphQL Headers JSON: %v", err), Status: "Configuration Error"}
		}
	}

	// 1. Load and Parse Variables
	variablesJSON := a.GetVariables()
	var variables map[string]string
	if err := json.Unmarshal([]byte(variablesJSON), &variables); err != nil {
		return ResponseMsg{Body: "Error parsing Env Variables", Status: "Configuration Error"}
	}

	// 2. Variable Substitution
	urlStr = replacePlaceholders(urlStr, variables)
	headersJSON = replacePlaceholders(headersJSON, variables)
	paramsJSON = replacePlaceholders(paramsJSON, variables)
	bodyStr = replacePlaceholders(bodyStr, variables)

	// 3. Parse Headers
	var headers map[string]string
	if err := json.Unmarshal([]byte(headersJSON), &headers); err != nil {
		return ResponseMsg{Body: "Error parsing Headers. Check JSON format.", Status: "Configuration Error"}
	}

	// 4. Parse Query Params & Build URL
	if paramsJSON != "" {
		var params map[string]string
		if err := json.Unmarshal([]byte(paramsJSON), &params); err != nil {
			return ResponseMsg{Body: "Error parsing Query Params. Check JSON format.", Status: "Configuration Error"}
		}
		parsedURL, err := url.Parse(urlStr)
		if err != nil {
			return ResponseMsg{Body: "Invalid URL format.", Status: "Configuration Error"}
		}
		q := parsedURL.Query()
		for key, value := range params {
			q.Set(key, value)
		}
		parsedURL.RawQuery = q.Encode()
		urlStr = parsedURL.String()
	}

	// 5. Build Request
	method = strings.ToUpper(strings.TrimSpace(method))
	var req *http.Request
	var err error

	// We only support a subset of methods with body for now, but standard http.NewRequest handles nil body fine for GET
	reqBody := bytes.NewBuffer([]byte(bodyStr))
	if bodyStr == "" {
		req, err = http.NewRequest(method, urlStr, nil)
	} else {
		req, err = http.NewRequest(method, urlStr, reqBody)
	}

	if err != nil {
		return ResponseMsg{Body: "Failed to create request: " + err.Error(), Status: "Error"}
	}

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	// 6. Execute (with timeout to prevent hanging UI)
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return ResponseMsg{Body: "Network Error: " + err.Error(), Status: "Error"}
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return ResponseMsg{Body: "Failed to read response body: " + err.Error(), Status: "Error"}
	}

	return ResponseMsg{Body: string(bodyBytes), Status: resp.Status}
}

func (a *App) GetRequests() []Request {
	return getSavedData().Requests
}

func (a *App) SaveRequest(r Request) string {
	data := getSavedData()

	if r.Id == "" {
		r.Id = uuid.New().String()
		data.Requests = append(data.Requests, r)
	} else {
		found := false
		for i, savedReq := range data.Requests {
			if savedReq.Id == r.Id {
				data.Requests[i] = r
				found = true
				break
			}
		}
		if !found {
			data.Requests = append(data.Requests, r)
		}
	}

	if err := saveSavedData(data); err != nil {
		return "Failed to save request: " + err.Error()
	}
	return "Request Saved Successfully"
}

func (a *App) DeleteRequest(id string) error {
	data := getSavedData()

	index := -1
	for i, req := range data.Requests {
		if req.Id == id {
			index = i
			break
		}
	}

	if index == -1 {
		return fmt.Errorf("id not found: %s", id)
	}

	data.Requests = append(data.Requests[:index], data.Requests[index+1:]...)

	if err := saveSavedData(data); err != nil {
		return err
	}
	return nil
}

func (a *App) GetVariables() string {
	vars := getSavedData().Variables
	if vars == "" {
		return "{}"
	}
	return vars
}

func (a *App) SaveVariables(variableString string) string {
	// Validate JSON
	var variables map[string]string
	if err := json.Unmarshal([]byte(variableString), &variables); err != nil {
		return "Error: Invalid JSON structure"
	}

	data := getSavedData()
	data.Variables = variableString

	if err := saveSavedData(data); err != nil {
		return "Failed to save variables: " + err.Error()
	}
	return "Environment Variables Saved Successfully"
}

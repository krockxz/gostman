package handler

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"time"
)

// ProxyRequest defines the structure of the incoming JSON body
type ProxyRequest struct {
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
}

// ProxyResponse defines the structure of the response we send back to the frontend
type ProxyResponse struct {
	Status  string            `json:"status"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
}

// Handler is the Vercel Serverless Function entrypoint
func Handler(w http.ResponseWriter, r *http.Request) {
	// CORS Headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var proxyReq ProxyRequest
	if err := json.NewDecoder(r.Body).Decode(&proxyReq); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create the outgoing request
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	reqBody := strings.NewReader(proxyReq.Body)
	outReq, err := http.NewRequest(proxyReq.Method, proxyReq.URL, reqBody)
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Copy headers
	for k, v := range proxyReq.Headers {
		outReq.Header.Set(k, v)
	}

	// Perform the request
	resp, err := client.Do(outReq)
	if err != nil {
		// Return error as JSON response so the frontend can display it nicely
		json.NewEncoder(w).Encode(ProxyResponse{
			Status: "Error",
			Body:   "Network Error: " + err.Error(),
		})
		return
	}
	defer resp.Body.Close()

	// Read response body
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		json.NewEncoder(w).Encode(ProxyResponse{
			Status: "Error",
			Body:   "Failed to read response: " + err.Error(),
		})
		return
	}

	// Prepare response
	respHeaders := make(map[string]string)
	for k, v := range resp.Header {
		respHeaders[k] = strings.Join(v, ", ")
	}

	response := ProxyResponse{
		Status:  resp.Status,
		Headers: respHeaders,
		Body:    string(bodyBytes),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

//go:build ignore

// local_server.go - Run this locally to serve the /api/proxy endpoint during development.
// Usage from the repo root: go run api/local_server.go
// This file is NOT deployed to Vercel (the "ignore" build tag excludes it from all builds).

package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

type ProxyRequest struct {
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
}

type ProxyResponse struct {
	Status  string            `json:"status"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
}

func proxyHandler(w http.ResponseWriter, r *http.Request) {
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

	client := &http.Client{Timeout: 30 * time.Second}
	outReq, err := http.NewRequest(proxyReq.Method, proxyReq.URL, strings.NewReader(proxyReq.Body))
	if err != nil {
		http.Error(w, "Failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for k, v := range proxyReq.Headers {
		outReq.Header.Set(k, v)
	}

	resp, err := client.Do(outReq)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ProxyResponse{Status: "Error", Body: "Network Error: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(ProxyResponse{Status: "Error", Body: "Failed to read response: " + err.Error()})
		return
	}

	respHeaders := make(map[string]string)
	for k, v := range resp.Header {
		respHeaders[k] = strings.Join(v, ", ")
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ProxyResponse{
		Status:  resp.Status,
		Headers: respHeaders,
		Body:    string(bodyBytes),
	})
}

func main() {
	port := "8787"
	http.HandleFunc("/api/proxy", proxyHandler)
	fmt.Printf("✓ Local proxy server running at http://localhost:%s/api/proxy\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

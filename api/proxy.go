package handler

import (
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
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
	Status  string        `json:"status"`
	Headers []HeaderEntry `json:"headers"`
	Body    string        `json:"body"`
	Cookies []CookieInfo  `json:"cookies"`
	Size    int64         `json:"size"`
}

// HeaderEntry represents a single header key-value pair
type HeaderEntry struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}

// CookieInfo represents a single response cookie, matching the desktop
// ResponseMsg.CookieInfo shape (app.go:72-80)
type CookieInfo struct {
	Name     string `json:"name"`
	Value    string `json:"value"`
	Domain   string `json:"domain"`
	Path     string `json:"path"`
	Expires  string `json:"expires"`
	Secure   bool   `json:"secure"`
	HttpOnly bool   `json:"httpOnly"`
}

func isPrivateIP(ip net.IP) bool {
	return ip.IsLoopback() || ip.IsPrivate() || ip.IsLinkLocalUnicast()
}

// writeProxyError writes a JSON-encoded ProxyResponse describing an error.
// The HTTP status is always 200 so the frontend's response.json() succeeds
// and the real error surfaces in the Status/Body fields. CORS headers are
// expected to already be set on the response writer.
func writeProxyError(w http.ResponseWriter, status, body string) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(ProxyResponse{
		Status: status,
		Body:   body,
	}); err != nil {
		log.Printf("Error writing proxy error response: %v", err)
	}
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
		writeProxyError(w, "Method Not Allowed", "Method not allowed")
		return
	}

	var proxyReq ProxyRequest
	if err := json.NewDecoder(r.Body).Decode(&proxyReq); err != nil {
		writeProxyError(w, "Invalid Request Body", "Invalid request body: "+err.Error())
		return
	}

	// Validate URL scheme (SSRF prevention)
	parsedURL, err := url.Parse(proxyReq.URL)
	if err != nil || (parsedURL.Scheme != "http" && parsedURL.Scheme != "https") {
		writeProxyError(w, "Error", "Invalid or unsupported URL scheme")
		return
	}

	if len(proxyReq.Body) > 10*1024*1024 {
		writeProxyError(w, "Error", "Request body too large")
		return
	}

	// Create the outgoing request with SSRF-safe redirect handling
	client := &http.Client{
		Timeout: 30 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 {
				return http.ErrUseLastResponse
			}
			host := req.URL.Hostname()
			if ip := net.ParseIP(host); ip != nil && isPrivateIP(ip) {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}

	reqBody := strings.NewReader(proxyReq.Body)
	outReq, err := http.NewRequest(proxyReq.Method, proxyReq.URL, reqBody)
	if err != nil {
		writeProxyError(w, "Failed To Create Request", "Failed to create request: "+err.Error())
		return
	}

	// Copy headers
	for k, v := range proxyReq.Headers {
		outReq.Header.Set(k, v)
	}

	// Perform the request
	resp, err := client.Do(outReq)
	if err != nil {
		writeProxyError(w, "Network Error", "Network Error: "+err.Error())
		return
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	// Read response body (limit to 50MB)
	bodyBytes, err := io.ReadAll(io.LimitReader(resp.Body, 50*1024*1024))
	if err != nil {
		writeProxyError(w, "Read Error", "Failed to read response: "+err.Error())
		return
	}

	// Collect ALL headers individually (no combining)
	var respHeaders []HeaderEntry
	for k, values := range resp.Header {
		for _, v := range values {
			respHeaders = append(respHeaders, HeaderEntry{Key: k, Value: v})
		}
	}

	// Collect cookies from response — matches app.go:289-304
	var respCookies []CookieInfo
	for _, cookie := range resp.Cookies() {
		expiresStr := ""
		if !cookie.Expires.IsZero() {
			expiresStr = cookie.Expires.UTC().Format(time.RFC1123)
		}
		respCookies = append(respCookies, CookieInfo{
			Name:     cookie.Name,
			Value:    cookie.Value,
			Domain:   cookie.Domain,
			Path:     cookie.Path,
			Expires:  expiresStr,
			Secure:   cookie.Secure,
			HttpOnly: cookie.HttpOnly,
		})
	}

	// Convert images to base64 data URL
	contentType := resp.Header.Get("Content-Type")
	var responseBody string
	if contentType != "" && strings.HasPrefix(strings.ToLower(contentType), "image/") {
		mimeType := strings.Split(contentType, ";")[0]
		base64Data := base64.StdEncoding.EncodeToString(bodyBytes)
		responseBody = "data:" + mimeType + ";base64," + base64Data
	} else {
		responseBody = string(bodyBytes)
	}

	response := ProxyResponse{
		Status:  resp.Status,
		Headers: respHeaders,
		Body:    responseBody,
		Cookies: respCookies,
		Size:    int64(len(bodyBytes)),
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding proxy response: %v", err)
		http.Error(w, "Internal error", http.StatusInternalServerError)
	}
}
